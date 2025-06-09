import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
    try {
        const { to, subject, html } = await request.json()

        const { data, error } = await resend.emails.send({
            from: 'Church Admin <no-reply@yourdomain.com>',
            to,
            subject,
            html
        })

        if (error) {
            return NextResponse.json({ error }, { status: 400 })
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error sending email:', error)
        return NextResponse.json(
            { error: 'Failed to send email' },
            { status: 500 }
        )
    }
}