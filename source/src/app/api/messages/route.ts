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
        // Enhanced validation
        console.log("Received data:", data);

        const errors = [];
        if (!data.name?.trim()) errors.push("Name is required");
        if (!data.email?.trim()) errors.push("Email is required");
        if (!data.message?.trim()) errors.push("Message is required");

        if (errors.length > 0) {
            return NextResponse.json(
                { error: "Validation failed", details: errors },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            return NextResponse.json(
                { error: "Invalid email format" },
                { status: 400 }
            );
        }

        const message_id = uuidv4();

        // Save to database
        const newMessage = await xata.db.messages.create({
            message_id,
            name: data.name.trim(),
            email: data.email.trim(),
            subject: data.subject?.trim() || 'No Subject',
            message: data.message.trim(),
            status: 'unread',
            createdAt: new Date().toISOString()
        });

        // Send notification email
        if (process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
            try {
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
                });

            } catch (emailError) {
                console.error('Failed to send notification email:', emailError);
            }
        }

        return NextResponse.json(newMessage, { status: 201 })
    } catch (error) {
        console.error('Error creating message:', error)
        return NextResponse.json(
            { error: 'Failed to create message' },
            { status: 500 }
        )
    }
}