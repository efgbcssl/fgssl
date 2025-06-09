import { NextResponse } from 'next/server'
import { xata } from '@/lib/xata'

export async function GET() {
    try {
        const now = new Date().toISOString()
        const events = await xata.db.events
            .filter('expiresAt', { $gt: now })
            .sort('order', 'asc')
            .getAll();

        // Clean the data before returning
        const cleanedEvents = events.map(event => ({
            id: event.xata_id,
            title: event.title,
            description: event.description,
            date: event.date,
            time: event.time,
            location: event.location,
            imageSrc: event.imageSrc,
            ctaText: event.ctaText,
            ctaLink: event.ctaLink,
            order: event.order,
            expiresAt: event.expiresAt
            // Explicitly excluding Xata system fields:
            // xata_createdat, xata_id, xata_updatedat, xata_version
        }));

        return NextResponse.json(cleanedEvents)
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to create event',
                details: typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : String(error),
                stack: process.env.NODE_ENV === 'development' && typeof error === 'object' && error !== null && 'stack' in error ? (error as { stack?: string }).stack : undefined
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json()
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { xata_id, ...cleanData } = data
        const eventDate = new Date(data.date)
        const expiresAt = new Date(eventDate.getTime() + 15 * 24 * 60 * 60 * 1000)

        console.log('Creating event with data: ', cleanData, expiresAt)

        const newEvent = await xata.db.events.create({
            ...cleanData,
            expiresAt: expiresAt.toISOString()
        })

        return NextResponse.json(newEvent, { status: 201 })
    } catch (error) {
        console.error('Error creating event: ', error)
        return NextResponse.json(
            { error: 'Failed to create event' },
            { status: 500 }
        )
    }
}