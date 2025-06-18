// app/api/appointments/check/route.ts
import { NextResponse } from 'next/server'
import { xata } from '@/lib/xata'
//import { format } from 'date-fns'

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

        // Create date range for filtering
        const startDate = new Date(`${date}T00:00:00.000Z`)
        const endDate = new Date(`${date}T23:59:59.999Z`)

        // Query appointments for the entire day
        const bookedAppointments = await xata.db.appointments
            .filter('preferredDate', {
                $ge: startDate.toISOString(),
                $le: endDate.toISOString()
            })
            .getAll()

        // Extract time slots
        const bookedSlots = bookedAppointments.map(appt => {
            const apptDate = new Date(appt.preferredDate)
            return apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
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