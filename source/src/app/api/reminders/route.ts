/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server'
import { xata } from '@/lib/xata'
import { sendReminderEmail } from '@/lib/email'

export async function GET() {
    try {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Validate environment variables
        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
            throw new Error('Email credentials not configured');
        }

        const upcomingAppointments = await xata.db.appointments
            .filter('preferredDate', {
                $ge: now.toISOString(),
                $le: tomorrow.toISOString(),
            })
            .filter('status', 'pending')
            .getAll();

        const results = await Promise.all(
            upcomingAppointments.map(async (appointment) => {
                try {
                    // Validate required fields
                    if (!appointment.email || !appointment.fullName || !appointment.preferredDate) {
                        throw new Error('Missing required appointment data');
                    }

                    await sendReminderEmail({
                        to: appointment.email,
                        fullName: appointment.fullName,
                        preferredDateTime: new Date(appointment.preferredDate).toLocaleString(),
                        medium: appointment.medium || 'unknown',
                    });

                    // Update appointment status (uncomment when ready)
                    // await xata.db.appointments.update(appointment.xata_id, { reminderSent: true });

                    return { id: appointment.xata_id, status: 'success' };
                } catch (error) {
                    return {
                        id: appointment.xata_id,
                        status: 'failed',
                        error: error instanceof Error ? error.message : 'Unknown error',
                    };
                }
            })
        );

        return NextResponse.json({
            success: results.filter((r) => r.status === 'success').length,
            failed: results.filter((r) => r.status === 'failed').length,
            results,
        });
    } catch (error) {
        console.error('Reminder job failed:', error);
        return NextResponse.json(
            {
                error: 'Failed to send reminders',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}