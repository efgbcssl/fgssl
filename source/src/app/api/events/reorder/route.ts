import { NextResponse } from 'next/server'
import { xata } from '@/lib/xata'

export async function PUT(request: Request) {
    try {
        const events = await request.json()

        // Xata doesn't support batch updates directly, so we update one by one
        for (const event of events) {
            await xata.db.events.update(event.id, { order: event.order })
        }

        return NextResponse.json({ success: true })
    } catch {
        return NextResponse.json(
            { error: 'Failed to reorder events' },
            { status: 500 }
        )
    }
}