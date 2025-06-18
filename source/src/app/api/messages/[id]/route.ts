import { xata } from '@/lib/xata'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const message = await xata.db.messages.read(params.id)
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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const data = await request.json()
        const updatedMessage = await xata.db.messages.update(params.id, data)
        return NextResponse.json(updatedMessage)
    } catch (error) {
        console.error('Error updating message:', error)
        return NextResponse.json(
            { error: 'Failed to update message' },
            { status: 500 }
        )
    }
}