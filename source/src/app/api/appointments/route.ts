import { xata } from '@/lib/xata'
import { NextResponse } from 'next/server'
import { sendAppointmentEmail } from '@/lib/email'
import { format } from 'date-fns'

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
        const { preferredDate, fullName, email, phoneNumber, medium } = data

        console.log('📥 Received appointment data:', data)
        // Validate required fields
        if (!preferredDate || !fullName || !email) {
            return NextResponse.json(
                { error: 'Missing required fields (preferredDate, fullName, email)' },
                { status: 400 }
            )
        }

        // Parse and validate the date
        const date = new Date(data.preferredDate)
        if (isNaN(date.getTime())) {
            return NextResponse.json(
                { error: 'Invalid date format' },
                { status: 400 }
            )
        }

        // Create time range for conflict checking (1 hour buffer)
        const startTime = new Date(date)
        startTime.setHours(startTime.getHours() - 1)

        const endTime = new Date(date)
        endTime.setHours(endTime.getHours() + 1)

        // Check for conflicting appointments
        const conflictingAppointments = await xata.db.appointments
            .filter({
                preferredDate: {
                    $ge: startTime,
                    $le: endTime
                }
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
            fullName,
            email,
            phoneNumber,
            preferredDate: date.toISOString(),
            medium: medium || 'in-person',
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        })

        // Extract formatted date/time for email
        const localDate = format(date, 'EEEE, MMMM do, yyyy')
        const localTime = format(date, 'hh:mm a')

        // Send confirmation email
        await sendAppointmentEmail({
            to: email,
            fullName,
            preferredDate: localDate,
            preferredTime: localTime,
            medium
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