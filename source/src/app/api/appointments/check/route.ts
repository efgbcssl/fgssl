// app/api/appointments/check/route.ts
import { NextResponse } from 'next/server'
import { xata } from '@/lib/xata'
import { format } from 'date-fns'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const date = searchParams.get('date')

        if (!date) {
            return NextResponse.json(
                { error: 'Date parameter is required' },
                { status: 400 }
            )
        }

        // Query your database for booked slots on this date
        const bookedAppointments = await xata.db.appointments
            .filter('preferredDate', { $contains: date })
            .getAll()

        // Extract just the time slots (HH:MM format)
        const bookedSlots = bookedAppointments.map(appt => {
            const date = new Date(appt.preferredDate)
            return format(date, 'HH:mm')
        })

        return NextResponse.json({ bookedSlots })
    } catch (error) {
        console.error('Error checking appointments:', error)
        return NextResponse.json(
            { error: 'Failed to check appointments' },
            { status: 500 }
        )
    }
}