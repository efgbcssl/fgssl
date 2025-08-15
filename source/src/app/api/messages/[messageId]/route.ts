import { NextResponse, NextRequest } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import { Message } from '@/models/Message'
import mongoose from 'mongoose'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ messageId: string }> }
) {
    try {
        await connectMongoDB()
        const { messageId } = await params

        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return NextResponse.json(
                { error: 'Invalid message ID format' },
                { status: 400 }
            )
        }

        const message = await Message.findById(messageId)
            .select('name email subject message status createdAt')
            .lean()

        if (!message) {
            return NextResponse.json(
                { error: 'Message not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(message)
    } catch (error) {
        console.error('Error fetching message:', error)
        return NextResponse.json(
            {
                error: 'Failed to fetch message',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ messageId: string }> }
) {
    try {
        await connectMongoDB()
        const { messageId } = await params
        const data = await request.json()

        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return NextResponse.json(
                { error: 'Invalid message ID format' },
                { status: 400 }
            )
        }

        // Validate allowed fields to update
        const allowedFields = ['status']
        const updates = Object.keys(data)

        const invalidFields = updates.filter(field => !allowedFields.includes(field))
        if (invalidFields.length > 0) {
            return NextResponse.json(
                { error: `Invalid fields: ${invalidFields.join(', ')}` },
                { status: 400 }
            )
        }

        // Validate status values
        if (data.status && !['unread', 'read', 'archived'].includes(data.status)) {
            return NextResponse.json(
                { error: 'Invalid status value' },
                { status: 400 }
            )
        }

        const updatedMessage = await Message.findByIdAndUpdate(
            messageId,
            data,
            { new: true, runValidators: true }
        ).select('name email subject message status createdAt')

        if (!updatedMessage) {
            return NextResponse.json(
                { error: 'Message not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(updatedMessage)
    } catch (error) {
        console.error('Error updating message:', error)
        return NextResponse.json(
            {
                error: 'Failed to update message',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ messageId: string }> }
) {
    try {
        await connectMongoDB()
        const { messageId } = await params

        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return NextResponse.json(
                { error: 'Invalid message ID format' },
                { status: 400 }
            )
        }

        const deletedMessage = await Message.findByIdAndDelete(messageId)

        if (!deletedMessage) {
            return NextResponse.json(
                { error: 'Message not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Message deleted successfully',
            deleted_id: messageId
        })
    } catch (error) {
        console.error('Error deleting message:', error)
        return NextResponse.json(
            {
                error: 'Failed to delete message',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}