// src/app/api/appointments/check/route.ts
import { NextResponse } from 'next/server'
import { xata } from '@/lib/xata'
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz'
import { sendAppointmentEmail } from '@/lib/email'

const TIMEZONE = 'America/New_York'
const APPOINTMENT_BUFFER_MINUTES = 30 // Buffer between appointments

// Helper for consistent error responses
const createErrorResponse = (message: string, status: number, details?: any) => {
    console.error(`[${status}] ${message}`, details)
    return NextResponse.json(
        {
            error: message,
            ...(details && { details: details instanceof Error ? details.message : details })
        },
        { status }
    )
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const dateParam = searchParams.get('date')
        const timezone = searchParams.get('timezone') || TIMEZONE

        // Validate input
        if (!dateParam) {
            return createErrorResponse('Date parameter is required', 400)
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
            return createErrorResponse('Invalid date format. Use YYYY-MM-DD', 400)
        }

        // Create date range for the entire day in specified timezone
        const startOfDay = fromZonedTime(new Date(`${dateParam}T00:00:00`), timezone)
        const endOfDay = fromZonedTime(new Date(`${dateParam}T23:59:59.999`), timezone)

        console.log(`🔍 Checking appointments for ${dateParam} in ${timezone}`, {
            startUTC: startOfDay.toISOString(),
            endUTC: endOfDay.toISOString()
        })

        // Query appointments with enhanced filtering
        const bookedAppointments = await xata.db.appointments
            .filter('preferredDate', {
                $ge: startOfDay.toISOString(),
                $le: endOfDay.toISOString()
            })
            .filter({ $not: { status: 'cancelled' } }) // Exclude cancelled appointments
            .select(['preferredDate', 'fullName'])
            .getAll()

        // Process time slots with proper timezone handling
        const bookedSlots = bookedAppointments.map(appt => {
            const apptDate = new Date(appt.preferredDate ?? '')
            return {
                time24: formatInTimeZone(apptDate, timezone, 'HH:mm'),
                timeDisplay: formatInTimeZone(apptDate, timezone, 'h:mm a'),
                name: appt.fullName
            }
        })

        return NextResponse.json({
            date: dateParam,
            timezone,
            availableSlots: generateTimeSlots(dateParam, timezone).filter(slot =>
                !bookedSlots.some(booked => booked.time24 === slot.time24)
            ),
            bookedSlots,
            stats: {
                totalBooked: bookedSlots.length,
                totalAvailable: 17 - bookedSlots.length // 9am-5pm with 30min slots = 17 slots
            }
        })

    } catch (error) {
        return createErrorResponse('Failed to check appointments', 500, error)
    }
}

// Generate all possible time slots for a day
function generateTimeSlots(date: string, timezone: string) {
    const slots = []
    for (let hour = 9; hour <= 17; hour++) { // 9am to 5pm
        for (let minute = 0; minute < 60; minute += 30) {
            const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
            const timeDate = fromZonedTime(new Date(`${date}T${time24}:00`), timezone)
            slots.push({
                time24,
                timeDisplay: formatInTimeZone(timeDate, timezone, 'h:mm a'),
                utc: timeDate.toISOString()
            })
        }
    }
    return slots
}

export async function POST(request: Request) {
    try {
        const data = await request.json()
        const {
            preferredDate,
            fullName,
            email,
            phoneNumber,
            medium,
            preferredTime
        } = data

        // Validate required fields
        const missingFields = []
        if (!preferredDate) missingFields.push('preferredDate')
        if (!fullName) missingFields.push('fullName')
        if (!email) missingFields.push('email')
        if (!phoneNumber) missingFields.push('phoneNumber')
        if (!medium) missingFields.push('medium')

        if (missingFields.length > 0) {
            return createErrorResponse(
                `Missing required fields: ${missingFields.join(', ')}`,
                400
            )
        }

        // Parse and validate the date
        const appointmentDate = new Date(preferredDate)
        if (isNaN(appointmentDate.getTime())) {
            return createErrorResponse('Invalid date format', 400)
        }

        // Check if date is in the past
        const nowInTz = toZonedTime(new Date(), TIMEZONE)
        if (appointmentDate < nowInTz) {
            return createErrorResponse('Cannot book appointments in the past', 400)
        }

        // Create time range for conflict checking
        const bufferMs = APPOINTMENT_BUFFER_MINUTES * 60 * 1000
        const startTime = new Date(appointmentDate.getTime() - bufferMs)
        const endTime = new Date(appointmentDate.getTime() + bufferMs)

        console.log('⏰ Checking for conflicts:', {
            appointmentTime: appointmentDate.toISOString(),
            checkRange: { start: startTime.toISOString(), end: endTime.toISOString() }
        })

        // Check for conflicts
        const conflictingAppointments = await xata.db.appointments
            .filter({
                $not: { status: 'cancelled' },
                preferredDate: {
                    $ge: startTime.toISOString(),
                    $le: endTime.toISOString()
                }
            })
            .select(['preferredDate', 'fullName'])
            .getAll()

        if (conflictingAppointments.length > 0) {
            const conflictDetails = conflictingAppointments.map(a => ({
                time: formatInTimeZone(new Date(a.preferredDate ?? ''), TIMEZONE, 'MMM d, h:mm a'),
                name: a.fullName
            }))

            return createErrorResponse(
                'Time slot unavailable due to conflicting appointment',
                409,
                { conflicts: conflictDetails }
            )
        }

        // Create new appointment
        const newAppointment = await xata.db.appointments.create({
            fullName,
            email,
            phoneNumber,
            preferredDate: appointmentDate.toISOString(),
            medium,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        })

        // Format for email
        const localDate = formatInTimeZone(appointmentDate, TIMEZONE, 'EEEE, MMMM do, yyyy')
        const localTime = preferredTime || formatInTimeZone(appointmentDate, TIMEZONE, 'h:mm a')

        // Send confirmation email (fire-and-forget)
        sendAppointmentEmail({
            to: email,
            fullName,
            preferredDate: localDate,
            preferredTime: localTime,
            medium
        }).catch(emailError => {
            console.error('⚠️ Email sending failed (non-critical):', emailError)
            // Consider logging to error tracking service
        })

        // Audit log
        console.log('✅ Appointment created:', {
            id: newAppointment.xata_id,
            name: fullName,
            date: localDate,
            time: localTime,
            medium
        })

        return NextResponse.json(
            {
                success: true,
                appointment: {
                    id: newAppointment.xata_id,
                    date: localDate,
                    time: localTime,
                    medium
                },
                confirmationSent: email
            },
            { status: 201 }
        )

    } catch (error) {
        return createErrorResponse('Failed to create appointment', 500, error)
    }
}