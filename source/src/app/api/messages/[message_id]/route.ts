import { xata } from '@/lib/xata'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: { message_id: string } }
) {
    try {
        console.log('Fetching message with ID:', params.message_id)

        // Use filter() instead of read() for better error handling
        const message = await xata.db.messages
            .filter('message_id', params.message_id)
            .getFirst()

        if (!message) {
            console.log('Message not found in database')
            return NextResponse.json(
                { error: 'Message not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(message)
    } catch (error) {
        console.error('Database error:', error)
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}


export async function PATCH(request: Request, { params }: { params: Promise<{ message_id: string }> }) {
    try {
        const data = await request.json()
        const updatedMessage = await xata.db.messages.update((await params).message_id, data)
        return NextResponse.json(updatedMessage)
    } catch (error) {
        console.error('Error updating message:', error)
        return NextResponse.json(
            { error: 'Failed to update message' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ message_id: string }> }
) {
    try {
        const deletedMessage = await xata.db.messages
            .filter({ message_id: (await params).message_id })
            .getFirst()
            .then(record => record?.delete())

        if (!deletedMessage) {
            return NextResponse.json(
                { error: 'Message not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting message:', error)
        return NextResponse.json(
            { error: 'Failed to delete message' },
            { status: 500 }
        )
    }
}