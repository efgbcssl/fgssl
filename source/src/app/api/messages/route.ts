import { xata } from '@/lib/xata'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { v4 as uuidv4 } from 'uuid';

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
    try {
        const messages = await xata.db.messages
            .sort('createdAt', 'desc')
            .getAll()
        return NextResponse.json(messages)
    } catch (error) {
        console.error('Error fetching messages:', error)
        return NextResponse.json(
            { error: 'Failed to fetch messages' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json()

        // Validate required fields
        if (!data.name || !data.email || !data.message) {
            return NextResponse.json(
                { error: 'Name, email, and message are required' },
                { status: 400 }
            )
        }

        const message_id = uuidv4();

        // Save to database
        const newMessage = await xata.db.messages.create({
            message_id,
            name: data.name,
            email: data.email,
            subject: data.subject || null,
            message: data.message,
            createdAt: new Date().toISOString()
        })

        // Send notification email
        await resend.emails.send({
            from: 'notifications@yourdomain.com',
            to: process.env.ADMIN_EMAIL || 'admin@yourdomain.com',
            subject: `New Contact Message: ${data.subject || 'No Subject'}`,
            html: `
        <h1>New Contact Form Submission</h1>
        <p><strong>From:</strong> ${data.name} (${data.email})</p>
        <p><strong>Subject:</strong> ${data.subject || 'None'}</p>
        <p><strong>Message:</strong></p>
        <p>${data.message}</p>
      `
        })

        return NextResponse.json(newMessage, { status: 201 })
    } catch (error) {
        console.error('Error creating message:', error)
        return NextResponse.json(
            { error: 'Failed to create message' },
            { status: 500 }
        )
    }
}