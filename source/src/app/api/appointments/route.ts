import { xata } from '@/lib/xata'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const appointments = await xata.db.appointments
            .sort('createdAt', 'desc')
            .getAll()
        return NextResponse.json(appointments)
    } catch {
        return NextResponse.json(
            { error: 'Failed to fetch appointments' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json()

        // Check for conflicting appointments
        const conflictingAppointments = await xata.db.appointments
            .filter('preferredDate', data.preferredDate)
            .getAll()

        if (conflictingAppointments.length > 0) {
            return NextResponse.json(
                { error: 'This time slot is already booked' },
                { status: 400 }
            )
        }

        const newAppointment = await xata.db.appointments.create({
            ...data,
            status: 'pending',
            createdAt: new Date().toISOString()
        })

        return NextResponse.json(newAppointment, { status: 201 })
    } catch {
        return NextResponse.json(
            { error: 'Failed to create appointment' },
            { status: 500 }
        )
    }
}