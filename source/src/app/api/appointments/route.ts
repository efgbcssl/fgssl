// src/app/api/appointments/check/route.ts
/*import { NextResponse } from 'next/server'
import { xata } from '@/lib/xata'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'

const TIMEZONE = 'America/New_York'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const date = searchParams.get('date')
        const timezone = searchParams.get('timezone') || TIMEZONE

        if (!date) {
            return NextResponse.json(
                { error: 'Date parameter is required' },
                { status: 400 }
            )
        }

        console.log('🔍 Checking appointments for:', { date, timezone })

        // Create date range for the entire day in the specified timezone
        const startOfDay = fromZonedTime(new Date(`${date}T00:00:00`), timezone)
        const endOfDay = fromZonedTime(new Date(`${date}T23:59:59`), timezone)

        console.log('📅 Date range (UTC):', {
            start: startOfDay.toISOString(),
            end: endOfDay.toISOString()
        })

        // Query appointments for the entire day
        const bookedAppointments = await xata.db.appointments
            .filter('preferredDate', {
                $ge: startOfDay.toISOString(),
                $le: endOfDay.toISOString()
            })
            .getAll()

        console.log('📋 Found appointments:', bookedAppointments.map(a => ({
            id: a.xata_id,
            utcTime: a.preferredDate,
            localTime: a.preferredDateLocal,
            name: a.fullName
        })))

        // Extract time slots in the requested timezone
        const bookedSlots = bookedAppointments.map(appt => {
            const apptDate = new Date(appt.preferredDate)
            // Format the time in the requested timezone
            return formatInTimeZone(apptDate, timezone, 'HH:mm')
        })

        console.log('⏰ Booked slots:', bookedSlots)

        return NextResponse.json({
            bookedSlots,
            totalBooked: bookedSlots.length,
            appointments: bookedAppointments.map(a => ({
                id: a.xata_id,
                time: formatInTimeZone(new Date(a.preferredDate), timezone, 'HH:mm'),
                name: a.fullName
            }))
        })
    } catch (error) {
        console.error('❌ Error checking appointments:', error)
        return NextResponse.json(
            {
                error: 'Failed to check appointments',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()

        const {
            fullName,
            phoneNumber,
            email,
            preferredDate,
            //preferredDateLocal,
            //timezone = TIMEZONE,
            medium = 'in-person',
            status = 'pending'
        } = body

        if (!fullName || !phoneNumber || !email || !preferredDate) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const utcDate = new Date(preferredDate)
        const localTime = formatInTimeZone(utcDate, timezone, 'yyyy-MM-dd HH:mm')

        console.log('📥 Received appointment request:')
        console.log({
            fullName,
            phoneNumber,
            email,
            utcDate: utcDate.toISOString(),
            localTime,
            medium,
            status
        })

        // Save appointment to Xata
        const record = await xata.db.appointments.create({
            fullName,
            phoneNumber,
            email,
            preferredDate: utcDate.toISOString(),
            //preferredDateLocal: preferredDateLocal || localTime,
            timezone,
            medium,
            status
        })

        console.log('✅ Appointment saved:', record?.xata_id)

        return NextResponse.json(
            { message: 'Appointment saved successfully', appointmentId: record?.xata_id },
            { status: 201 }
        )
    } catch (error) {
        console.error('❌ Error saving appointment:', error)
        return NextResponse.json(
            {
                error: 'Failed to save appointment',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}*/

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
        if (!preferredDate || !fullName || !email || !phoneNumber || !medium) {
            return NextResponse.json(
                { error: 'Missing required fields (preferredDate, fullName, email, phoneNumber, medium)' },
                { status: 400 }
            );
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