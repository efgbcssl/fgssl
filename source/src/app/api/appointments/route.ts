import { xata } from '@/lib/xata'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const appointments = await xata.db.appointments
            .sort('createdAt', 'desc')
            .getAll()
        return NextResponse.json(appointments)
    } catch (error) {
        console.error('Error fetching appointments:', error)
        return NextResponse.json(
            {
                error: 'Failed to fetch appointments',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json()

        // Validate required fields
        if (!data.preferredDate || !data.fullName || !data.email) {
            return NextResponse.json(
                { error: 'Missing required fields (preferredDate, fullName, email)' },
                { status: 400 }
            )
        }

        // Parse and validate the date
        const preferredDate = new Date(data.preferredDate)
        if (isNaN(preferredDate.getTime())) {
            return NextResponse.json(
                { error: 'Invalid date format' },
                { status: 400 }
            )
        }

        // Create time range for conflict checking (1 hour buffer)
        const startTime = new Date(preferredDate)
        startTime.setHours(startTime.getHours() - 1)

        const endTime = new Date(preferredDate)
        endTime.setHours(endTime.getHours() + 1)

        // Check for conflicting appointments
        const conflictingAppointments = await xata.db.appointments
            .filter({
                $any: [
                    {
                        preferredDate: {
                            $ge: startTime.toISOString(),
                            $le: endTime.toISOString()
                        }
                    },
                    {
                        preferredDate: data.preferredDate // Exact match fallback
                    }
                ]
            })
            .getAll()

        if (conflictingAppointments.length > 0) {
            return NextResponse.json(
                {
                    error: 'This time slot is already booked',
                    conflictingSlots: conflictingAppointments.map(a => a.preferredDate)
                },
                { status: 400 }
            )
        }

        // Create new appointment
        const newAppointment = await xata.db.appointments.create({
            ...data,
            preferredDate: preferredDate.toISOString(), // Ensure ISO format
            status: 'pending',
            createdAt: new Date().toISOString()
        })

        return NextResponse.json(newAppointment, { status: 201 })
    } catch (error) {
        console.error('Error creating appointment:', error)
        return NextResponse.json(
            {
                error: 'Failed to create appointment',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}