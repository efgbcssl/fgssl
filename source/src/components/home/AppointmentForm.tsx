/* eslint-disable prefer-const */
"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { isBefore, isToday, startOfDay } from 'date-fns'
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const TIMEZONE = 'America/New_York'

const formatTimeToAMPM = (time24: string) => {
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hours12 = hours % 12 || 12
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`
}

const formatAMPMto24 = (time12: string) => {
  const [timePart, period] = time12.split(' ')
  let [hours, minutes] = timePart.split(':').map(Number)
  if (period === 'PM' && hours !== 12) hours += 12
  else if (period === 'AM' && hours === 12) hours = 0
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

export default function AppointmentForm() {
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState<string>('')
  const [medium, setMedium] = useState("in-person")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [fullyBookedDates, setFullyBookedDates] = useState<string[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const { toast } = useToast()

  // Generate only 9AM-4:30PM slots (last appointment ends at 5PM)
  const availableTimes = useMemo(() => {
    const times = []
    for (let hour = 9; hour <= 16; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        times.push(formatTimeToAMPM(time24))
      }
    }
    return times
  }, [])

  const checkBookedSlots = useCallback(async (selectedDate: Date) => {
    if (!selectedDate) return

    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : process.env.NEXT_PUBLIC_SITE_URL || ''

    setIsChecking(true)
    try {
      const dateStr = formatInTimeZone(selectedDate, TIMEZONE, 'yyyy-MM-dd')
      const response = await fetch(`${baseUrl}/api/appointments/check?date=${dateStr}&timezone=${TIMEZONE}`)

      if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)

      const data = await response.json()
      const bookedSlotsAMPM = data.bookedSlots?.map((slot: string) => formatTimeToAMPM(slot)) || []
      setBookedSlots(bookedSlotsAMPM)

      // Update fully booked dates
      if (bookedSlotsAMPM.length === availableTimes.length) {
        setFullyBookedDates(prev => [...prev, dateStr])
      } else {
        setFullyBookedDates(prev => prev.filter(d => d !== dateStr))
      }

    } catch (error) {
      console.error('Error checking slots:', error)
      setBookedSlots([])
      toast({
        title: "Error",
        description: "Failed to check available slots. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsChecking(false)
    }
  }, [availableTimes.length, toast])

  const handleDateSelect = useCallback((selectedDate: Date | undefined) => {
    if (!selectedDate) return
    setDate(selectedDate)
    setTime('')
    checkBookedSlots(selectedDate)
  }, [checkBookedSlots])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Basic validation
    if (!date || !time) {
      toast({
        title: "Error",
        description: "Please select a date and time.",
        variant: "destructive"
      });
      return;
    }

    if (bookedSlots.includes(time)) {
      toast({
        title: "Error",
        description: "The selected time slot is already booked.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formElement = e.currentTarget;
      const formData = new FormData(formElement);
      const formValues = Object.fromEntries(formData.entries());

      // Validate required fields
      if (!formValues.fullName || !formValues.phoneNumber || !formValues.email) {
        throw new Error("Please fill in all required fields.");
      }

      // Convert selected time to 24-hour format
      const time24 = formatAMPMto24(time);
      const dateStr = formatInTimeZone(date, TIMEZONE, 'yyyy-MM-dd');

      // Create the appointment datetime in New York timezone
      const nyDateTime = toZonedTime(
        new Date(`${dateStr}T${time24}:00`),
        TIMEZONE
      );

      // Convert to UTC for the API
      const utcDateTime = fromZonedTime(nyDateTime, TIMEZONE);

      // Prepare appointment data
      const appointmentData = {
        fullName: formValues.fullName as string,
        email: formValues.email as string,
        phoneNumber: formValues.phoneNumber as string,
        preferredDate: utcDateTime.toISOString(),
        medium: medium as 'in-person' | 'online',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Submit to API
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to submit appointment');
      }

      // Reset form on success
      formElement.reset();
      setDate(undefined);
      setTime('');
      setMedium('in-person');
      setBookedSlots([]);

      toast({
        title: "Success!",
        description: "Your appointment request has been submitted. We'll contact you to confirm.",
      });

    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDateDisabled = useCallback((date: Date) => {
    const nowInEastern = toZonedTime(new Date(), TIMEZONE)
    const todayStart = startOfDay(nowInEastern)
    const checkDate = toZonedTime(date, TIMEZONE)
    const checkDateStart = startOfDay(checkDate)
    const dateStr = formatInTimeZone(date, TIMEZONE, 'yyyy-MM-dd')

    return (
      isBefore(checkDateStart, todayStart) ||
      date.getDay() === 0 ||
      fullyBookedDates.includes(dateStr)
    )
  }, [fullyBookedDates])

  const getAvailableTimesForDate = useCallback(() => {
    if (!date) return []
    const nowInEastern = toZonedTime(new Date(), TIMEZONE)
    const selectedInEastern = toZonedTime(date, TIMEZONE)
    const isSelectedToday = isToday(selectedInEastern)

    return availableTimes.filter(timeSlot => {
      if (bookedSlots.includes(timeSlot)) return false
      if (isSelectedToday) {
        const time24 = formatAMPMto24(timeSlot)
        const [hour, minute] = time24.split(':').map(Number)
        const slotTime = new Date(nowInEastern)
        slotTime.setHours(hour, minute, 0, 0)
        return isBefore(nowInEastern, new Date(slotTime.getTime() - 30 * 60 * 1000))
      }
      return true
    })
  }, [date, availableTimes, bookedSlots])

  const availableTimesForDate = useMemo(() => getAvailableTimesForDate(), [getAvailableTimesForDate])

  useEffect(() => {
    if (date && !time && availableTimesForDate.length > 0) {
      setTime(availableTimesForDate[0])
    }
  }, [date, time, availableTimesForDate])

  const isFormValid = date && time && !bookedSlots.includes(time) && availableTimesForDate.includes(time)
  const CurrentLocalTime = () => {
    const [currentTime, setCurrentTime] = useState({
      localTime: '',
      easternTime: '',
      timeDifference: ''
    });

    useEffect(() => {
      const updateTime = () => {
        const now = new Date();

        // Local time
        const localFormatted = now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        });

        // Eastern Time
        const easternFormatted = now.toLocaleTimeString('en-US', {
          timeZone: 'America/New_York',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        });

        // Calculate time difference
        const localOffset = now.getTimezoneOffset();
        const easternOffset = new Date(now.toLocaleString('en-US', {
          timeZone: 'America/New_York'
        })).getTimezoneOffset();

        const diffHours = (easternOffset - localOffset) / 60;
        const timeDiff = diffHours === 0 ?
          "same time" :
          `${Math.abs(diffHours)} hour${Math.abs(diffHours) > 1 ? 's' : ''} ${diffHours > 0 ? 'behind' : 'ahead'}`;

        setCurrentTime({
          localTime: localFormatted,
          easternTime: easternFormatted,
          timeDifference: timeDiff
        });
      };

      updateTime();
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }, []);

    return (
      <span className="text-sm text-gray-500 ml-2">
        Your Current Time (አሁን ባሉበት ስፍራ ሰዓቱ): {currentTime.localTime}
      </span>
    );
  };
  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 font-heading text-church-primary">
              Schedule an Appointment
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Would you like to speak with our pastor or church staff? Schedule an appointment below.
              <br />
              <span className="text-sm text-gray-500 mt-2 block">
                All times are in Eastern Time (Silver Spring, MD)
              </span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="John Doe"
                    required
                    className="border-gray-300 focus:border-church-primary h-12"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    placeholder="(123) 456-7890"
                    required
                    type="tel"
                    className="border-gray-300 focus:border-church-primary h-12"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    placeholder="your@email.com"
                    required
                    type="email"
                    className="border-gray-300 focus:border-church-primary h-12"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Meeting Type *</Label>
                  <RadioGroup
                    value={medium}
                    onValueChange={setMedium}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="in-person" id="in-person" className="peer hidden" />
                      <Label
                        htmlFor="in-person"
                        className="flex flex-col p-3 border border-gray-300 rounded-lg cursor-pointer peer-data-[state=checked]:border-church-primary peer-data-[state=checked]:bg-church-primary/10"
                      >
                        <span className="font-medium">In-Person</span>
                        <span className="text-sm text-gray-500">At our location</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="online" id="online" className="peer hidden" />
                      <Label
                        htmlFor="online"
                        className="flex flex-col p-3 border border-gray-300 rounded-lg cursor-pointer peer-data-[state=checked]:border-church-primary peer-data-[state=checked]:bg-church-primary/10"
                      >
                        <span className="font-medium">Online</span>
                        <span className="text-sm text-gray-500">Video call</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Preferred Date *</Label>
                  <div className="border rounded-lg overflow-hidden shadow-sm">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateSelect}
                      initialFocus
                      disabled={isDateDisabled}
                      className="w-full"
                      modifiers={{
                        fullyBooked: (date) => {
                          const dateStr = formatInTimeZone(date, TIMEZONE, 'yyyy-MM-dd')
                          return fullyBookedDates.includes(dateStr)
                        }
                      }}
                      modifiersStyles={{
                        fullyBooked: { backgroundColor: '#f3f4f6', color: '#9ca3af' }
                      }}
                      classNames={{
                        months: "w-full",
                        month: "space-y-4 w-full",
                        caption: "flex justify-between items-center px-4 pt-3",
                        caption_label: "text-sm font-medium",
                        nav: "flex gap-1",
                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                        table: "w-full border-collapse",
                        head_row: "w-full",
                        head_cell: "text-gray-500 rounded-md w-10 font-normal text-sm",
                        row: "w-full mt-2",
                        cell: "text-center p-0 relative [&:has([aria-selected])]:bg-church-primary/10 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                        day: cn(
                          "h-10 w-10 p-0 font-normal rounded-full",
                          "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-church-primary",
                          "aria-selected:opacity-100",
                          "data-[today]:bg-gray-100 data-[today]:font-semibold",
                          "data-[selected]:bg-church-primary data-[selected]:text-white",
                          "data-[disabled]:text-gray-400 data-[disabled]:pointer-events-none"
                        ),
                        day_selected: "bg-church-primary text-white hover:bg-church-primary focus:bg-church-primary",
                        day_today: "bg-gray-100",
                        day_disabled: "text-gray-400 opacity-50",
                        day_outside: "text-gray-400 opacity-50",
                        day_range_middle: "aria-selected:bg-church-primary/10 aria-selected:text-church-primary",
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    Available Times * (9AM-5PM Eastern)
                    <CurrentLocalTime />
                    {isChecking && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
                  </Label>
                  <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                    {availableTimesForDate.length > 0 ? (
                      availableTimes.map((slot) => {
                        const isBooked = bookedSlots.includes(slot);
                        const isAvailable = availableTimesForDate.includes(slot);
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => !isBooked && setTime(slot)}
                            disabled={isBooked}
                            className={cn(
                              'py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center h-10',
                              time === slot && isAvailable
                                ? 'bg-church-primary text-white shadow-md'
                                : isBooked
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-white hover:bg-gray-100 border border-gray-200',
                              !isAvailable && 'opacity-50'
                            )}
                            aria-disabled={isBooked}
                          >
                            {slot}
                            {isBooked && (
                              <span className="sr-only">(Booked)</span>
                            )}
                          </button>

                        );
                      })
                    ) : (
                      <div className="col-span-3 text-center py-4 text-gray-500">
                        {date ? 'No available slots for this date' : 'Select a date to see available times'}
                      </div>
                    )}
                  </div>
                  {date && time && (() => {
                    const userTime = new Date(date);
                    const [hours, minutes] = formatAMPMto24(time).split(':').map(Number);
                    userTime.setHours(hours, minutes, 0, 0);

                    const churchTime = toZonedTime(userTime, TIMEZONE);
                    const userOffset = userTime.getTimezoneOffset();
                    const churchOffset = new Date(churchTime.toLocaleString('en-US', { timeZone: TIMEZONE })).getTimezoneOffset();
                    const diffHours = (userOffset - churchOffset) / 60;
                    const timeDiffText = diffHours === 0
                      ? "same time"
                      : `${Math.abs(diffHours)} hour${Math.abs(diffHours) > 1 ? 's' : ''} ${diffHours > 0 ? 'behind' : 'ahead'}`;

                    return (
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <div>
                          <span className="font-medium">Your appointment date and time (ቀጠሮ የያዙበት ቀን እና ሰዓት):</span> {date.toLocaleDateString()} at {time}
                        </div>
                        {/*}
                        <div className="text-xs">
                          <span className="font-medium">Church time in Maryland (አሁን በ ሜሪላንድ/ቸርች ስዓት አቆጣጠር):</span> {
                            formatInTimeZone(churchTime, TIMEZONE, 'EEEE, MMMM d, yyyy h:mm a')
                          } (Eastern Time)
                        </div>
                        
                        <div className="text-xs text-blue-600">
                          <span className="font-medium">Note:</span> Maryland time is {timeDiffText} your local time • Same calendar day
                        </div>
                        */}
                      </div>
                    )
                  })()}
                  {date && bookedSlots.length > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      {bookedSlots.length} slot(s) already booked
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Button
                type="submit"
                className="w-full bg-church-primary hover:bg-church-primary/90 h-14 text-lg font-medium"
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Request Appointment"
                )}
              </Button>
              <p className="text-sm text-gray-500 mt-3 text-center">
                We&apos;ll contact you to confirm your appointment details.
              </p>
            </div>
          </form>
        </div>
      </div >
    </section >
  )
}
