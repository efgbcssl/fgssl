import { xata } from '@/lib/xata'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { sendMessageNotificationEmail } from '@/lib/email'

export async function GET() {
    try {
        const messages = await xata.db.messages
            .select(['message_id', 'name', 'email', 'subject', 'message', 'status', 'createdAt'])
            .sort('createdAt', 'desc')
            .getAll()

        return NextResponse.json(messages)
    } catch (error) {
        console.error('Error fetching messages:', error)
        return NextResponse.json(
            {
                error: 'Failed to fetch messages',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json()

        // Enhanced validation
        const errors = []
        if (!data.name?.trim()) errors.push('Name is required')
        if (!data.email?.trim()) errors.push('Email is required')
        if (!data.message?.trim()) errors.push('Message is required')

        if (errors.length > 0) {
            return NextResponse.json(
                { error: 'Validation failed', details: errors },
                { status: 400 }
            )
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(data.email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            )
        }

        const message_id = uuidv4()

        // Save to database
        const newMessage = await xata.db.messages.create({
            message_id,
            name: data.name.trim(),
            email: data.email.trim(),
            subject: data.subject?.trim() || 'No Subject',
            message: data.message.trim(),
            status: 'unread',
            createdAt: new Date().toISOString()
        })

        // Send notification email (non-blocking)
        if (process.env.ADMIN_EMAIL) {
            sendMessageNotificationEmail({
                to: process.env.ADMIN_EMAIL,
                fullName: data.name.trim(),
                email: data.email.trim(),
                subject: data.subject?.trim(),
                message: data.message.trim()
            }).catch(error => {
                console.error('Failed to send notification email:', error)
            })
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Message submitted successfully',
                data: {
                    id: newMessage.message_id,
                    createdAt: newMessage.createdAt
                }
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('Error creating message:', error)
        return NextResponse.json(
            {
                error: 'Failed to create message',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}