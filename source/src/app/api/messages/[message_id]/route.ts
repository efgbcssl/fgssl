import { xata } from '@/lib/xata'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: Promise<{ message_id: string }> }) {
    try {
        const { message_id } = await params
        const message = await xata.db.messages.read(message_id)
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
            { error: 'Failed to fetch message' },
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