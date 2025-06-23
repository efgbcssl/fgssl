//src/components/home/AppointmentForm.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect, useCallback } from 'react'
import { format, isBefore, isToday, addDays } from 'date-fns'
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const TIMEZONE = 'America/New_York' // Eastern Time for Silver Spring, MD

export default function AppointmentForm() {
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState<string>('09:00')
  const [medium, setMedium] = useState("in-person")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const { toast } = useToast()

  // Generate available times (9AM-5PM, every 30 minutes) in Eastern Time
  const generateTimes = useCallback(() => {
    const times = []
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
      }
    }
    return times
  }, [])

  const availableTimes = generateTimes()

  const checkBookedSlots = useCallback(async (selectedDate: Date) => {
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : process.env.NEXT_PUBLIC_SITE_URL || ''

    setIsChecking(true)
    try {
      // Format date in Eastern Time
      const dateStr = formatInTimeZone(selectedDate, TIMEZONE, 'yyyy-MM-dd')
      const response = await fetch(`${baseUrl}/api/appointments/check?date=${dateStr}&timezone=${TIMEZONE}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setBookedSlots(data.bookedSlots || [])
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
  }, [toast])

  const handleDateSelect = useCallback((selectedDate: Date | undefined) => {
    if (!selectedDate) return

    setDate(selectedDate)
    setTime('09:00') // Reset time when date changes

    // Get current date in Eastern Time for comparison
    const nowInEastern = toZonedTime(new Date(), TIMEZONE)
    const selectedInEastern = toZonedTime(selectedDate, TIMEZONE)

    // Only check slots if date is today or in the future (in Eastern Time)
    if (!isBefore(selectedInEastern, nowInEastern) || isToday(selectedInEastern)) {
      checkBookedSlots(selectedDate)
    }
  }, [checkBookedSlots])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!date || !time) {
      toast({
        title: "Error",
        description: "Please select a date and time.",
        variant: "destructive"
      })
      return
    }

    if (bookedSlots.includes(time)) {
      toast({
        title: "Error",
        description: "The selected time slot is already booked.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formElement = e.currentTarget
      const formData = new FormData(formElement)
      const formValues = Object.fromEntries(formData.entries())

      // Validate required fields
      if (!formValues.fullName || !formValues.phoneNumber || !formValues.email) {
        throw new Error("Please fill in all required fields.")
      }

      // Create date in Eastern Time, then convert to UTC for storage
      const dateStr = formatInTimeZone(date, TIMEZONE, 'yyyy-MM-dd')
      const easternDateTime = new Date(`${dateStr}T${time}:00`)
      const utcDateTime = fromZonedTime(easternDateTime, TIMEZONE)

      console.log('Selected date/time (Eastern):', `${dateStr} ${time}`)
      console.log('UTC date/time for storage:', utcDateTime.toISOString())

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formValues.fullName,
          phoneNumber: formValues.phoneNumber,
          email: formValues.email,
          preferredDate: utcDateTime.toISOString(),
          preferredDateLocal: `${dateStr} ${time}`, // Keep local time for reference
          timezone: TIMEZONE,
          medium,
          status: 'pending'
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'Failed to submit appointment.'

        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorMessage
        } catch (jsonErr) {
          console.warn('Response is not JSON:', errorText)
        }

        throw new Error(errorMessage)
      }
      console.log('Server returned:', response.status, response.statusText)


      // Reset form on success
      try {
        formElement.reset()
        setDate(undefined)
        setTime('09:00')
        setMedium('in-person')
        setBookedSlots([])
      } catch (resetError) {
        console.error('Error resetting form:', resetError)
      }

      toast({
        title: "Success!",
        description: "Your appointment request has been submitted. We'll contact you to confirm the details.",
      })

    } catch (error) {
      console.error('Submit error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isDateDisabled = (date: Date) => {
    // Get current date in Eastern Time
    const nowInEastern = toZonedTime(new Date(), TIMEZONE)
    const todayInEastern = new Date(nowInEastern)
    todayInEastern.setHours(0, 0, 0, 0)

    const checkDate = toZonedTime(date, TIMEZONE)
    checkDate.setHours(0, 0, 0, 0)

    return isBefore(checkDate, todayInEastern) || date.getDay() === 0 // Disable past dates and Sundays
  }

  // Filter out past time slots if selected date is today
  const getAvailableTimesForDate = useCallback(() => {
    if (!date) return availableTimes

    const nowInEastern = toZonedTime(new Date(), TIMEZONE)
    const selectedInEastern = toZonedTime(date, TIMEZONE)

    // If selected date is today, filter out past times
    if (isToday(selectedInEastern)) {
      const currentHour = nowInEastern.getHours()
      const currentMinute = nowInEastern.getMinutes()

      return availableTimes.filter(timeSlot => {
        const [hour, minute] = timeSlot.split(':').map(Number)
        const slotTime = hour * 60 + minute
        const currentTime = currentHour * 60 + currentMinute

        // Add 30 minute buffer for booking
        return slotTime > currentTime + 30
      })
    }

    return availableTimes
  }, [date, availableTimes])

  const availableTimesForDate = getAvailableTimesForDate()
  const isFormValid = date && time && !bookedSlots.includes(time) && availableTimesForDate.includes(time)

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
              {/* Left Column - Personal Info */}
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

              {/* Right Column - Date & Time */}
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
                    Available Times * (Eastern Time)
                    {isChecking && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
                  </Label>
                  <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                    {availableTimesForDate.map((slot) => {
                      const isBooked = bookedSlots.includes(slot)
                      const isDisabled = isBooked || !date

                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setTime(slot)}
                          disabled={isDisabled}
                          className={cn(
                            'py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center h-10',
                            time === slot
                              ? 'bg-church-primary text-white shadow-md'
                              : 'bg-white hover:bg-gray-100 border border-gray-200',
                            isDisabled && 'opacity-50 cursor-not-allowed bg-gray-100'
                          )}
                        >
                          {slot}
                          {isBooked && (
                            <span className="sr-only">(Booked)</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {date && availableTimesForDate.length === 0 && (
                    <p className="text-sm text-red-500 mt-2">
                      No available slots for this date. Please choose another date.
                    </p>
                  )}
                  {date && bookedSlots.length === availableTimesForDate.length && availableTimesForDate.length > 0 && (
                    <p className="text-sm text-red-500 mt-2">
                      All remaining slots are booked for this date. Please choose another date.
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
      </div>
    </section>
  )
}