/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { isBefore, startOfDay } from "date-fns"
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

type Slot = {
  /** UTC ISO string for the start of the slot */
  id: string
  /** Human readable local time for the user (e.g., "9:30 PM") */
  userLabel: string
  /** New York display (e.g., "2:30 PM") */
  nyLabel: string
  /** New York 24h key (e.g., "14:30") – used to compare with API booked slots */
  ny24: string
}

const PASTOR_TZ = "America/New_York"

// New York availability windows by weekday (0=Sun ... 6=Sat)
const AVAIL_WINDOWS_NY: Record<number, Array<{ start: string; end: string }>> = {
  1: [{ start: "14:00", end: "17:00" }], // Monday
  3: [{ start: "14:00", end: "17:00" }], // Wednesday
  6: [{ start: "14:00", end: "18:00" }], // Saturday
}

/** Step between slots in minutes */
const SLOT_STEP_MIN = 30

/** Utilities */
const parseHM = (hm: string) => {
  const [h, m] = hm.split(":").map(Number)
  return { h, m }
}

const toAMPM = (date: Date, tz: string) =>
  formatInTimeZone(date, tz, "h:mm a")

/** Builds all 30-min slots for a New York date (YYYY-MM-DD) and returns UTC instants. */
const buildNySlotsToUTC = (nyYmd: string): Date[] => {
  // Pick an “anchor” date in NY time zone
  const dayStartNY = toZonedTime(new Date(`${nyYmd}T00:00:00`), PASTOR_TZ)
  const dowNY = dayStartNY.getDay()
  const windows = AVAIL_WINDOWS_NY[dowNY] || []
  const result: Date[] = []

  for (const w of windows) {
    const { h: sh, m: sm } = parseHM(w.start)
    const { h: eh, m: em } = parseHM(w.end)
    // Iterate 30-min slots [start, end) — last slot starts at end - 30 minutes
    let cursorNY = toZonedTime(new Date(`${nyYmd}T00:00:00`), PASTOR_TZ)
    cursorNY.setHours(sh, sm, 0, 0)

    // End boundary for slot starts
    const endNY = toZonedTime(new Date(`${nyYmd}T00:00:00`), PASTOR_TZ)
    endNY.setHours(eh, em, 0, 0)

    while (cursorNY < endNY) {
      // Convert this New York instant to UTC for storage/comparison
      const slotUTC = fromZonedTime(cursorNY, PASTOR_TZ)
      result.push(slotUTC)

      // Step
      const next = new Date(cursorNY.getTime() + SLOT_STEP_MIN * 60 * 1000)
      cursorNY = next
    }
  }

  return result
}

export default function AppointmentForm() {
  const { toast } = useToast()

  /** Detected user timezone */
  const [userTZ, setUserTZ] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    } catch {
      return "UTC"
    }
  })

  /** Calendar date (user’s local date) */
  const [date, setDate] = useState<Date>()
  /** Selected slot (UTC ISO) */
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  /** Radio: in-person | online */
  const [medium, setMedium] = useState<"in-person" | "online">("in-person")
  /** Loading states */
  const [isChecking, setIsChecking] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  /** Booked slot keys returned by API (NY 24h like "14:00") */
  const [bookedNyTimes, setBookedNyTimes] = useState<string[]>([])
  /** Dates (NY yyyy-MM-dd) that are fully booked */
  const [fullyBookedNyDates, setFullyBookedNyDates] = useState<string[]>([])

  /** Build the New York date string (yyyy-MM-dd) for the currently picked local date. */
  const nyYmdForSelectedLocal = useMemo(() => {
    if (!date) return ""
    // Use noon to avoid DST boundary weirdness
    const localNoon = new Date(date)
    localNoon.setHours(12, 0, 0, 0)
    const nyAtLocalNoon = toZonedTime(localNoon, PASTOR_TZ)
    return formatInTimeZone(nyAtLocalNoon, PASTOR_TZ, "yyyy-MM-dd")
  }, [date])

  /** All possible slots for the selected day (generated from NY windows) */
  const allSlotsForDay: Slot[] = useMemo(() => {
    if (!nyYmdForSelectedLocal) return []
    const utcSlots = buildNySlotsToUTC(nyYmdForSelectedLocal)
    return utcSlots.map((utcDate) => {
      const nyLabel = toAMPM(utcDate, PASTOR_TZ)
      const userLabel = toAMPM(utcDate, userTZ)
      const ny24 = formatInTimeZone(utcDate, PASTOR_TZ, "HH:mm")
      return {
        id: utcDate.toISOString(),
        userLabel,
        nyLabel,
        ny24,
      }
    })
  }, [nyYmdForSelectedLocal, userTZ])

  /** Filter out slots that are already booked, or are in the past. */
  const openSlotsForDay: Slot[] = useMemo(() => {
    const nowUTC = new Date()
    return allSlotsForDay.filter(
      (s) => !bookedNyTimes.includes(s.ny24) && new Date(s.id) > nowUTC
    )
  }, [allSlotsForDay, bookedNyTimes])

  /** Check the selected day's bookings from API (based on NY date) */
  const checkBookedSlots = useCallback(
    async (nyYmd: string) => {
      if (!nyYmd) return
      // Base URL logic same as your original code
      const baseUrl =
        process.env.NODE_ENV === "development"
          ? "http://localhost:3000"
          : process.env.NEXT_PUBLIC_SITE_URL || ""

      setIsChecking(true)
      try {
        const response = await fetch(
          `${baseUrl}/api/appointments/check?date=${nyYmd}&timezone=${PASTOR_TZ}`
        )
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)
        const data = await response.json()
        // Expecting data.bookedSlots as NY 24h strings ["14:00","14:30",...]
        const slots: string[] = Array.isArray(data.bookedSlots) ? data.bookedSlots : []

        setBookedNyTimes(slots)

        // mark fully booked NY dates
        const totalDaySlots = buildNySlotsToUTC(nyYmd).length
        setFullyBookedNyDates((prev) => {
          const exists = prev.includes(nyYmd)
          const shouldBe = slots.length >= totalDaySlots
          if (shouldBe && !exists) return [...prev, nyYmd]
          if (!shouldBe && exists) return prev.filter((d) => d !== nyYmd)
          return prev
        })
      } catch (err) {
        console.error("Error checking slots:", err)
        setBookedNyTimes([])
        toast({
          title: "Error",
          description: "Failed to check available slots. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsChecking(false)
      }
    },
    [toast]
  )

  /** When user picks a date, reset selection & fetch booked slots for that NY date */
  const handleDateSelect = useCallback(
    (selectedDate: Date | undefined) => {
      setSelectedSlot("")
      setDate(selectedDate)
    },
    []
  )

  useEffect(() => {
    if (nyYmdForSelectedLocal) {
      checkBookedSlots(nyYmdForSelectedLocal)
    }
  }, [nyYmdForSelectedLocal, checkBookedSlots])

  /** Auto-pick first open slot when date changes */
  useEffect(() => {
    if (openSlotsForDay.length > 0 && !selectedSlot) {
      setSelectedSlot(openSlotsForDay[0].id)
    }
  }, [openSlotsForDay, selectedSlot])

  /** Disable dates that are:
   *  - before today (user’s local)
   *  - not Mon/Wed/Sat **in New York**
   *  - fully booked **in New York**
   */
  const isDateDisabled = useCallback(
    (d: Date) => {
      // Past relative to the user's local midnight
      const todayLocalStart = startOfDay(new Date())
      if (isBefore(d, todayLocalStart)) return true

      // Compute the NY date string for this local date (use noon-anchor)
      const localNoon = new Date(d)
      localNoon.setHours(12, 0, 0, 0)
      const nyAtLocalNoon = toZonedTime(localNoon, PASTOR_TZ)
      const dowNY = nyAtLocalNoon.getDay()
      const nyYmd = formatInTimeZone(nyAtLocalNoon, PASTOR_TZ, "yyyy-MM-dd")

      // Only allow Mon/Wed/Sat in NY
      const hasWindow = !!AVAIL_WINDOWS_NY[dowNY]
      if (!hasWindow) return true

      // Fully booked NY date
      if (fullyBookedNyDates.includes(nyYmd)) return true

      return false
    },
    [fullyBookedNyDates]
  )

  /** Submit */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!date || !selectedSlot) {
      toast({
        title: "Error",
        description: "Please select a date and time.",
        variant: "destructive",
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

      // Selected slot is already UTC ISO
      const preferredUtcISO = selectedSlot

      // For the API, include both timezones to help with emails
      const payload = {
        fullName: formValues.fullName as string,
        email: formValues.email as string,
        phoneNumber: formValues.phoneNumber as string,
        preferredDate: preferredUtcISO, // stored in UTC
        medium,
        // helpful metadata for server-side notifications
        userTimeZone: userTZ,
        pastorTimeZone: PASTOR_TZ,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Failed to submit appointment")
      }

      formElement.reset()
      setDate(undefined)
      setSelectedSlot("")
      setMedium("in-person")
      setBookedNyTimes([])

      toast({
        title: "Success!",
        description:
          "Your appointment request has been submitted. We'll contact you to confirm.",
      })
    } catch (error) {
      console.error("Submit error:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  /** Small helper UI showing detected zones + currently selected slot mapping */
  const SelectionSummary = () => {
    if (!selectedSlot) return null
    const slotUTC = new Date(selectedSlot)
    const userText = formatInTimeZone(slotUTC, userTZ, "EEEE, MMM d, yyyy h:mm a")
    const nyText = formatInTimeZone(slotUTC, PASTOR_TZ, "EEEE, MMM d, yyyy h:mm a")
    return (
      <div className="mt-2 text-sm text-gray-600 space-y-1">
        <div>
          <span className="font-medium">Your local time: </span>
          {userText} ({userTZ})
        </div>
        <div className="text-xs text-gray-500">
          Pastor’s time: {nyText} ({PASTOR_TZ})
        </div>
      </div>
    )
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 font-heading text-church-primary">
              Schedule an Appointment
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Book a time in <span className="font-medium">your timezone</span>.
              We’ll show the pastor the same appointment in New York time.
              <br />
              <span className="text-sm text-gray-500 mt-2 block">
                Availability is on Mon/Wed/Sat in New York (Silver Spring, MD). Times below are shown in your timezone ({userTZ}).
              </span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left column: contact + medium */}
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
                    onValueChange={(v) => setMedium(v as "in-person" | "online")}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="in-person" id="in-person" className="peer hidden" />
                      <Label
                        htmlFor="in-person"
                        className="flex flex-col p-3 border border-gray-300 rounded-lg cursor-pointer peer-data-[state=checked]:border-church-primary peer-data-[state=checked]:bg-church-primary/10"
                      >
                        <span className="font-medium">In-Person</span>
                        <span className="text-sm text-gray-500">Silver Spring, MD</span>
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

              {/* Right column: date + time */}
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
                        fullyBooked: (d) => {
                          const noon = new Date(d)
                          noon.setHours(12, 0, 0, 0)
                          const ny = toZonedTime(noon, PASTOR_TZ)
                          const ymd = formatInTimeZone(ny, PASTOR_TZ, "yyyy-MM-dd")
                          return fullyBookedNyDates.includes(ymd)
                        },
                      }}
                      modifiersStyles={{
                        fullyBooked: { backgroundColor: "#f3f4f6", color: "#9ca3af" },
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
                        cell:
                          "text-center p-0 relative [&:has([aria-selected])]:bg-church-primary/10 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
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
                    Available Times * (shown in {userTZ})
                    {isChecking && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
                  </Label>

                  <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                    {date ? (
                      openSlotsForDay.length > 0 ? (
                        allSlotsForDay.map((slot) => {
                          const isBooked = bookedNyTimes.includes(slot.ny24)
                          const isPast = new Date(slot.id) <= new Date()
                          const isOpen = !isBooked && !isPast
                          const isSelected = selectedSlot === slot.id
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => isOpen && setSelectedSlot(slot.id)}
                              disabled={!isOpen}
                              className={cn(
                                "py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center h-10",
                                isSelected && isOpen
                                  ? "bg-church-primary text-white shadow-md"
                                  : !isOpen
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-white hover:bg-gray-100 border border-gray-200"
                              )}
                              aria-disabled={!isOpen}
                              title={`Pastor sees: ${slot.nyLabel} (${PASTOR_TZ})`}
                            >
                              {slot.userLabel}
                            </button>
                          )
                        })
                      ) : (
                        <div className="col-span-3 text-center py-4 text-gray-500">
                          No available slots for this date
                        </div>
                      )
                    ) : (
                      <div className="col-span-3 text-center py-4 text-gray-500">
                        Select a date to see available times
                      </div>
                    )}
                  </div>

                  {/* Selection summary */}
                  {selectedSlot && <SelectionSummary />}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Button
                type="submit"
                className="w-full bg-church-primary hover:bg-church-primary/90 h-14 text-lg font-medium"
                disabled={!selectedSlot || isSubmitting}
                onClick={(e) => {
                  // Let the form handle the real submission:
                }}
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

            {/* Hidden submit that uses our custom handler */}
            <form onSubmit={handleSubmit} className="hidden" />
          </form>
        </div>
      </div>
    </section>
  )
}
