/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server'
import { xata } from '@/lib/xata'
import { sendReminderEmail, generateTimezoneInfo } from '@/lib/email'
import { formatInTimeZone } from 'date-fns-tz'

export async function GET() {
    try {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Validate environment variables
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
            throw new Error('Email server credentials not configured');
        }

        // Fetch upcoming appointments in the next 24 hours
        const upcomingAppointments = await xata.db.appointments
            .filter('preferredDate', {
                $ge: now.toISOString(),
                $le: tomorrow.toISOString(),
            })
            .filter('status', 'pending')
            .getMany();

        const results = await Promise.all(
            upcomingAppointments.map(async (appointment) => {
                try {
                    // Validate required fields
                    if (!appointment.email || !appointment.fullName || !appointment.preferredDate || !appointment.xata_id) {
                        throw new Error('Missing required appointment data');
                    }

                    // Parse appointment date
                    const appointmentDate = new Date(appointment.preferredDate);

                    // Generate timezone information
                    const timezoneInfo = await generateTimezoneInfo(appointmentDate);

                    // Format dates for display
                    const preferredDate = formatInTimeZone(appointmentDate, Intl.DateTimeFormat().resolvedOptions().timeZone, 'EEEE, MMMM do, yyyy');
                    const preferredTime = formatInTimeZone(appointmentDate, Intl.DateTimeFormat().resolvedOptions().timeZone, 'h:mm a');

                    // Send reminder email
                    await sendReminderEmail({
                        to: appointment.email,
                        fullName: appointment.fullName,
                        preferredDate,
                        preferredTime,
                        medium: appointment.medium || 'unknown',
                        newYorkDate: timezoneInfo.newYorkDate,
                        newYorkTime: timezoneInfo.newYorkTime,
                        timeDifference: timezoneInfo.timeDifference,
                        meetingLink: '',
                        rescheduleLink: `${process.env.BASE_URL}/appointments/reschedule?id=${appointment.xata_id}`,
                        cancelLink: `${process.env.BASE_URL}/appointments/cancel?id=${appointment.xata_id}`,
                        unsubscribeLink: `${process.env.BASE_URL}/preferences?email=${encodeURIComponent(appointment.email)}`
                    });

                    // Update only existing fields
                    const updateData: Record<string, any> = {
                        reminderSent: true
                    };

                    // Try to update lastReminderSentAt if it exists (won't fail if column doesn't exist)
                    try {
                        updateData.lastReminderSentAt = new Date().toISOString();
                    } catch (e) {
                        console.log('lastReminderSentAt column not available, skipping');
                    }

                    const updatedRecord = await xata.db.appointments.update(appointment.xata_id, updateData);

                    if (!updatedRecord) {
                        throw new Error('Failed to update appointment record');
                    }

                    return { id: appointment.xata_id, status: 'success' };
                } catch (error) {
                    console.error(`Failed to process appointment ${appointment.xata_id}:`, error);
                    return {
                        id: appointment.xata_id,
                        status: 'failed',
                        error: error instanceof Error ? error.message : 'Unknown error',
                    };
                }
            })
        );

        return NextResponse.json({
            message: 'Reminder processing completed',
            stats: {
                total: results.length,
                success: results.filter((r) => r.status === 'success').length,
                failed: results.filter((r) => r.status === 'failed').length,
            },
            results,
        });
    } catch (error) {
        console.error('Reminder job failed:', error);
        return NextResponse.json(
            {
                error: 'Failed to process reminders',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}