/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect, useCallback } from 'react'
import { format, isBefore, isToday, addDays } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export default function AppointmentForm() {
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState<string>('09:00')
  const [medium, setMedium] = useState("in-person")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const { toast } = useToast()

  // Generate available times (9AM-5PM, every 30 minutes)
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
    // Handle both development and production environments
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : process.env.NEXT_PUBLIC_SITE_URL || ''

    setIsChecking(true)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const response = await fetch(`${baseUrl}/api/appointments/check?date=${dateStr}`)

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

    // Only check slots if date is in the future
    if (!isBefore(selectedDate, new Date())) {
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
      const formData = new FormData(e.currentTarget)
      const formValues = Object.fromEntries(formData.entries())

      // Create proper ISO string with timezone
      const dateStr = format(date, 'yyyy-MM-dd')
      const dateTime = new Date(`${dateStr}T${time}:00.000Z`)

      // Validate required fields
      if (!formValues.fullName || !formValues.phoneNumber || !formValues.email) {
        throw new Error("Please fill in all required fields.")
      }

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formValues.fullName,
          phoneNumber: formValues.phoneNumber,
          email: formValues.email,
          preferredDate: dateTime.toISOString(),
          medium,
          status: 'pending'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to submit appointment.')
      }

      if (e.currentTarget) {
        e.currentTarget.reset();
      }
      toast({
        title: "Success!",
        description: "Your appointment request has been submitted.",
      })

      // Reset form
      e.currentTarget.reset()
      setDate(undefined)
      setTime('09:00')
      setBookedSlots([])
    } catch (error) {
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
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return isBefore(date, today) || date.getDay() === 0 // Disable Sundays
  }

  const isFormValid = date && time && !bookedSlots.includes(time)

  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto"> {/* Increased max width */}
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 font-heading text-church-primary">
              Schedule an Appointment
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Would you like to speak with our pastor or church staff? Schedule an appointment below.
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
                    defaultValue="in-person"
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
                        day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100",
                        day_selected: "bg-church-primary text-white hover:bg-church-primary focus:bg-church-primary",
                        day_today: "bg-gray-100",
                        day_disabled: "text-gray-400 opacity-50",
                        day_outside: "text-gray-400 opacity-50",
                        day_range_middle: "aria-selected:bg-church-primary/10 aria-selected:text-church-primary",
                      }}
                      hidden={{ before: new Date() }} // only allow dates from tomorrow
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    Available Times *
                    {isChecking && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
                  </Label>
                  <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                    {availableTimes.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTime(slot)}
                        disabled={bookedSlots.includes(slot) || !date}
                        className={cn(
                          'py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center h-10',
                          time === slot
                            ? 'bg-church-primary text-white shadow-md'
                            : 'bg-white hover:bg-gray-100 border border-gray-200',
                          (bookedSlots.includes(slot) || !date) && 'opacity-50 cursor-not-allowed bg-gray-100'
                        )}
                      >
                        {slot}
                        {bookedSlots.includes(slot) && (
                          <span className="sr-only">(Booked)</span>
                        )}
                      </button>
                    ))}
                  </div>
                  {date && bookedSlots.length === availableTimes.length && (
                    <p className="text-sm text-red-500 mt-2">
                      All slots are booked for this date. Please choose another date.
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