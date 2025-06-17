import { NextResponse } from 'next/server'
import { xata } from '@/lib/xata'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const data = await request.json()
        const eventDate = new Date(data.date)
        const expiresAt = new Date(eventDate.getTime() + 15 * 24 * 60 * 60 * 1000)

        const updatedEvent = await xata.db.events.update((await params).id, {
            ...data,
            expiresAt: expiresAt.toISOString()
        })

        return NextResponse.json(updatedEvent)
    } catch {
        return NextResponse.json(
            { error: 'Failed to update event' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        await xata.db.events.delete(params.id)
        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json(
            { error: 'Failed to delete event' },
            { status: 500 }
        )
    }
}