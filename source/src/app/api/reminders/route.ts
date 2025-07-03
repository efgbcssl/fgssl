/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server'
import { xata } from '@/lib/xata'
import { sendReminderEmail } from '@/lib/email'

export async function GET() {
    try {
        const now = new Date()
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

        // Find appointments happening in the next 24 hours that haven't had reminders sent
        const upcomingAppointments = await xata.db.appointments
            .filter('preferredDate', {
                $ge: now.toISOString(),
                $le: tomorrow.toISOString()
            })
            .filter('status', 'pending')
            .getAll()

        // Send reminders
        const results = []
        for (const appointment of upcomingAppointments) {
            try {
                await sendReminderEmail({
                    to: appointment.email ?? '',
                    fullName: appointment.fullName ?? '',
                    preferredDateTime: new Date(appointment.preferredDate ?? '').toLocaleString(),
                    medium: appointment.medium ?? '',
                })

                // Update appointment to mark reminder sent
                //await xata.db.appointments.update(
                //  { id: appointment.xata_id, reminderSent: true }
                //)

                results.push({ id: appointment.xata_id, status: 'success' })
            } catch (error) {
                results.push({
                    id: appointment.xata_id,
                    status: 'failed',
                    error: typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : String(error)
                })
            }
        }

        return NextResponse.json({
            success: results.filter(r => r.status === 'success').length,
            failed: results.filter(r => r.status === 'failed').length,
            results
        })
    } catch (error) {
        return NextResponse.json(
            {
                error: 'Failed to send reminders',
                details: typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : String(error)
            },
            { status: 500 }
        )
    }
}