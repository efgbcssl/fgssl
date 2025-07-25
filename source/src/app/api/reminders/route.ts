/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server'
import { xata } from '@/lib/xata'
import { sendReminderEmail } from '@/lib/email'
import { subHours } from 'date-fns';

interface Appointment {
    email: string;
    fullName: string;
    preferredDate: string; // or Date if you're working with Date objects
    xata_id: string;
    reminderSent?: boolean; // Optional if not always present
    lastReminderSentAt?: string; // Optional if not always present
    status: string; // Assuming status is a string
}

export async function GET() {
    try {

        // Calculate time range (now to 24 hours from now)
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setHours(now.getHours() + 24);

        // Fetch appointments that:
        // 1. Are in the next 24 hours
        // 2. Are pending
        // 3. Haven't had a reminder sent (or it was sent >24h ago)
        const upcomingAppointments = await xata.db.appointments
            .filter('preferredDate', {
                $ge: now.toISOString(),
                $le: tomorrow.toISOString(),
            })
            .filter('status', 'pending')
            .filter({
                $not: {
                    lastReminderSentAt: {
                        $ge: subHours(now, 12).toISOString() // Prevent duplicates within 12h
                    }
                }
            } as any)
            .getMany();

        // Process in batches to avoid rate limiting
        const BATCH_SIZE = 10;
        const results = [];

        for (let i = 0; i < upcomingAppointments.length; i += BATCH_SIZE) {
            const batch = upcomingAppointments.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.all(
                batch.map(processAppointmentReminder)
            );
            results.push(...batchResults);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay between batches
        }

        return NextResponse.json({
            message: 'Reminder processing completed',
            stats: {
                total: results.length,
                success: results.filter(r => r.status === 'success').length,
                failed: results.filter(r => r.status === 'failed').length,
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

async function processAppointmentReminder(appointment: any) {
    try {
        // Validate required fields
        const requiredFields = ['email', 'fullName', 'preferredDate', 'xata_id'];
        const missingFields = requiredFields.filter(f => !appointment[f as keyof Appointment]);

        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Process and send email
        const result = await sendReminderEmail(appointment);

        // Update database
        await xata.db.appointments.update(appointment.xata_id, {
            reminderSent: true,
            lastReminderSentAt: new Date().toISOString(),
            status: 'completed' // Or your desired status
        } as any);

        return { id: appointment.xata_id, status: 'success' };
    } catch (error) {
        console.error(`Failed to process appointment ${appointment.xata_id}:`, error);
        return {
            id: appointment.xata_id,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}