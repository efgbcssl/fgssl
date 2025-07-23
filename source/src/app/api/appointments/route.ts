/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/appointments/route.ts
import { NextResponse } from 'next/server'
import { xata } from '@/lib/xata'
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz'
import { sendAppointmentEmail } from '@/lib/email'
import { isBefore, isToday } from 'date-fns'

const TIMEZONE = 'America/New_York'
const APPOINTMENT_BUFFER_MINUTES = 30 // Buffer between appointments
const WORKING_HOURS = { start: 0, end: 24 } // 9am to 5pm

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
        const date = searchParams.get('date')
        const timezone = searchParams.get('timezone') || TIMEZONE

        if (date) {
            // Handle check availability request
            return handleCheckAvailability(date, timezone)
        }

        // Default GET behavior - fetch all appointments
        const appointments = await xata.db.appointments
            .sort('preferredDate', 'desc')
            .getAll()

        return NextResponse.json(appointments)
    } catch (error) {
        return createErrorResponse('Failed to fetch appointments', 500, error)
    }
}

async function handleCheckAvailability(date: string, timezone: string) {
    try {
        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return createErrorResponse('Invalid date format. Use YYYY-MM-DD', 400)
        }

        // Parse date in specified timezone
        const selectedDate = fromZonedTime(new Date(`${date}T00:00:00`), timezone)
        const nowInTz = toZonedTime(new Date(), timezone)

        // Check if date is in the past (excluding today)
        if (isBefore(selectedDate, nowInTz) && !isToday(selectedDate)) {
            return NextResponse.json({
                available: false,
                message: 'Cannot check availability for past dates',
                bookedSlots: []
            })
        }

        // Get all appointments for the selected date
        const startOfDay = new Date(selectedDate)
        startOfDay.setHours(0, 0, 0, 0)

        const endOfDay = new Date(selectedDate)
        endOfDay.setHours(23, 59, 59, 999)

        const appointments = await xata.db.appointments
            .filter({
                $not: { status: 'cancelled' },
                $all: [
                    { preferredDate: { $ge: startOfDay.toISOString() } },
                    { preferredDate: { $le: endOfDay.toISOString() } }
                ]
            })
            .select(['preferredDate'])
            .getAll()
        // Extract booked time slots in 24h format
        const bookedSlots = appointments.map(appointment => {
            const appointmentDate = new Date(appointment.preferredDate ?? '')
            return formatInTimeZone(appointmentDate, timezone, 'HH:mm')
        })

        return NextResponse.json({
            available: true,
            bookedSlots,
            timezone
        })

    } catch (error) {
        return createErrorResponse('Failed to check availability', 500, error)
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { preferredDate, fullName, email, phoneNumber, medium } = data;

        // Validate required fields
        const missingFields = [
            !preferredDate && 'preferredDate',
            !fullName && 'fullName',
            !email && 'email',
            !phoneNumber && 'phoneNumber',
            !medium && 'medium'
        ].filter(Boolean) as string[];

        if (missingFields.length > 0) {
            return createErrorResponse(
                `Missing required fields: ${missingFields.join(', ')}`,
                400,
                { code: 'MISSING_FIELDS' }
            );
        }

        // Parse and validate the date
        const utcDate = new Date(preferredDate);
        if (isNaN(utcDate.getTime())) {
            return createErrorResponse('Invalid date format', 400, { code: 'INVALID_DATE' });
        }

        // Convert to New York time for validation
        const nyDate = toZonedTime(utcDate, TIMEZONE);
        const nowInNy = toZonedTime(new Date(), TIMEZONE);
        const nyHour = nyDate.getHours();

        // Check if date is in the past
        if (isBefore(nyDate, nowInNy)) {
            return createErrorResponse('Cannot book appointments in the past', 400, { code: 'PAST_DATE' });
        }

        // Validate working hours (9AM-5PM NY time)
        const appointmentHour = nyDate.getHours();
        if (nyHour < WORKING_HOURS.start || nyHour >= WORKING_HOURS.end) {
            return createErrorResponse(
                `Appointments must be between ${WORKING_HOURS.start}AM and ${WORKING_HOURS.end}PM New York time`,
                400,
                {
                    code: 'OUTSIDE_WORKING_HOURS',
                    newYorkTime: formatInTimeZone(nyDate, TIMEZONE, 'h:mm a')
                }
            );
        }

        // Check for conflicts
        const bufferMs = APPOINTMENT_BUFFER_MINUTES * 60 * 1000;
        const startTime = new Date(utcDate.getTime() - bufferMs);
        const endTime = new Date(utcDate.getTime() + bufferMs);

        const conflictingAppointments = await xata.db.appointments
            .filter({
                $not: { status: 'cancelled' },
                $all: [
                    { preferredDate: { $ge: startTime.toISOString() } },
                    { preferredDate: { $le: endTime.toISOString() } }
                ]
            })
            .select(['preferredDate', 'fullName'])
            .getAll();

        if (conflictingAppointments.length > 0) {
            const conflictDetails = conflictingAppointments.map(a => ({
                time: formatInTimeZone(new Date(a.preferredDate ?? ''), TIMEZONE, 'MMM d, h:mm a'),
                name: a.fullName
            }));

            return createErrorResponse(
                'Time slot unavailable due to conflicting appointment',
                409,
                { conflicts: conflictDetails, code: "TIME_CONFLICT" }
            );
        }

        // Create new appointment (storing as UTC)
        const newAppointment = await xata.db.appointments.create({
            fullName,
            email,
            phoneNumber,
            preferredDate: utcDate.toISOString(),
            medium,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        // Prepare timezone-aware information for email
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const userLocalTime = formatInTimeZone(utcDate, userTimeZone, 'EEEE, MMMM do, yyyy h:mm a');
        const newYorkTime = formatInTimeZone(utcDate, TIMEZONE, 'EEEE, MMMM do, yyyy h:mm a');

        // Send confirmation email (fire-and-forget)
        sendAppointmentEmail({
            to: email,
            fullName,
            preferredDate: userLocalTime,
            preferredTime: formatInTimeZone(utcDate, userTimeZone, 'h:mm a'),
            newYorkTime,
            newYorkDate: formatInTimeZone(utcDate, TIMEZONE, 'h:mm a'),
            timeDifference: '',
            medium
        }).catch(error => console.error('Email sending failed:', error));

        return NextResponse.json(
            {
                success: true,
                appointment: {
                    id: newAppointment.xata_id,
                    userLocalTime,
                    newYorkTime,
                    medium
                },
                confirmationSent: !!email
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Appointment creation failed:', error);
        return createErrorResponse(
            'Failed to create appointment',
            500,
            error instanceof Error ? { message: error.message } : undefined
        );
    }
}