import { xata } from '@/lib/xata'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    context: { params: Promise<{ message_id: string }> }
) {
    try {
        const { message_id } = await context.params

        if (!message_id) {
            return NextResponse.json(
                { error: 'message_id parameter is required' },
                { status: 400 }
            )
        }

        const message = await xata.db.messages
            .filter({ message_id })
            .select([
                'message_id',
                'name',
                'email',
                'subject',
                'message',
                'status',
                'createdAt'
            ])
            .getFirst()

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
    request: Request,
    context: { params: Promise<{ message_id: string }> }
) {
    try {
        const { message_id } = await context.params
        const data = await request.json()

        if (!message_id) {
            return NextResponse.json(
                { error: 'message_id parameter is required' },
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

        const updatedMessage = await xata.db.messages
            .filter({ message_id })
            .getFirst()
            .then((record: { update: (d: unknown) => Promise<unknown> } | null) => record?.update(data))

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
    context: { params: Promise<{ message_id: string }> }
) {
    try {
        const { message_id } = await context.params

        if (!message_id) {
            return NextResponse.json(
                { error: 'message_id parameter is required' },
                { status: 400 }
            )
        }

        const deletedMessage = await xata.db.messages
            .filter({ message_id })
            .getFirst()
            .then((record: { delete: () => Promise<unknown> } | null) => record?.delete())

        if (!deletedMessage) {
            return NextResponse.json(
                { error: 'Message not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Message deleted successfully',
            deleted_id: message_id
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