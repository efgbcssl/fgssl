// app/api/appointments/check/route.ts
import { NextResponse } from 'next/server'
import { xata } from '@/lib/xata'
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz'
import { isBefore, isToday } from 'date-fns';

const TIMEZONE = 'America/New_York' // Eastern Time for Silver Spring, MD

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const date = searchParams.get('date')
        const timezone = searchParams.get('timezone') || TIMEZONE

        if (!date) {
            return NextResponse.json(
                { error: 'Date parameter is required', code: 'MISSING_DATE' },
                { status: 400 }
            )
        }

        // Validate date format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return NextResponse.json(
                { error: 'Invalid date format. Use YYYY-MM-DD', code: 'INVALID_DATE_FORMAT' },
                { status: 400 }
            )
        }

        // Parse date in specified timezone
        const selectedDate = fromZonedTime(new Date(`${date}T00:00:00`), timezone)
        const nowInTz = toZonedTime(new Date(), timezone)

        // Check if date is in the past (excluding today)
        if (isBefore(selectedDate, nowInTz) && !isToday(selectedDate)) {
            return NextResponse.json({
                available: false,
                message: 'Cannot check availability for past dates',
                bookedSlots: [],
                timezone
            })
        }

        // Create date range for filtering (in UTC)
        const startDate = new Date(`${date}T00:00:00.000Z`)
        const endDate = new Date(`${date}T23:59:59.999Z`)
        const startDateISO = startDate.toISOString()
        const endDateISO = endDate.toISOString()


        // Query appointments for the entire day
        const bookedAppointments = await xata.db.appointments
            .filter({
                $not: { status: 'cancelled' },
                $all: [
                    { preferredDate: { $ge: startDateISO } },
                    { preferredDate: { $le: endDateISO } }
                ]
            })
            .select(['preferredDate', 'fullName'])
            .getAll()

        // Extract time slots in 24h format from the perspective of the requested timezone
        const bookedSlots = bookedAppointments
            .filter(appt => appt.preferredDate)
            .map(appt => {
                const apptDate = new Date(appt.preferredDate as string)
                return formatInTimeZone(apptDate, timezone, 'HH:mm') // 24-hour format
            })

        return NextResponse.json({
            success: true,
            bookedSlots,
            timezone,
            date: formatInTimeZone(selectedDate, timezone, 'yyyy-MM-dd'),
            totalBooked: bookedSlots.length
        })

    } catch (error) {
        console.error('Error checking appointments:', error)
        return NextResponse.json(
            {
                error: 'Failed to check appointments',
                code: 'SERVER_ERROR',
                details: error instanceof Error ? error.message : undefined
            },
            { status: 500 }
        )
    }
}