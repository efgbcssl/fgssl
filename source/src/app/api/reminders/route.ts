import { NextResponse } from 'next/server'
import { xata } from '@/lib/xata'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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
            .filter('reminderSent', false)
            .getAll()

        // Send reminders
        const results = []
        for (const appointment of upcomingAppointments) {
            try {
                const { data, error } = await resend.emails.send({
                    from: 'Church Reminders <no-reply@yourdomain.com>',
                    to: appointment.email,
                    subject: 'Appointment Reminder',
                    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2a3990;">Appointment Reminder</h2>
              <p>Dear ${appointment.fullName},</p>
              <p>This is a friendly reminder about your upcoming appointment:</p>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>Date & Time:</strong> ${new Date(appointment.preferredDate).toLocaleString()}</p>
                <p><strong>Meeting Type:</strong> ${appointment.medium === 'in-person' ? 'In-Person' : 'Online'}</p>
              </div>
              
              <p>Please contact us if you need to reschedule.</p>
              <p>Blessings,<br>The Church Team</p>
            </div>
          `
                })

                if (error) throw error

                // Update appointment to mark reminder sent
                await xata.db.appointments.update(appointment.id, {
                    reminderSent: true
                })

                results.push({ id: appointment.id, status: 'success' })
            } catch (error) {
                results.push({ id: appointment.id, status: 'failed', error: error.message })
            }
        }

        return NextResponse.json({
            success: results.filter(r => r.status === 'success').length,
            failed: results.filter(r => r.status === 'failed').length,
            results
        })
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to send reminders', details: error.message },
            { status: 500 }
        )
    }
}