import { NextResponse } from 'next/server'
import { xata } from '@/lib/xata'

export const dynamic = 'force-dynamic'
export async function GET() {
    try {
        const now = new Date().toISOString()
        console.log('Fetching events with filter:', { expiresAt: { $gt: now } });

        const events = await xata.db.events
            .filter('expiresAt', { $gt: now })
            .sort('order', 'asc')
            .getAll();
        console.log('events', events)
        if (!events) {
            throw new Error('No events found or query failed');
        }

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
        }));

        const response = NextResponse.json(cleanedEvents);
        response.headers.set('Access-Control-Allow-Origin', '*');

        return response;
    } catch (error) {
        let errorMessage = 'Unknown error';
        let errorStack: string | undefined = undefined;
        let errorStatus: unknown = undefined;

        if (error && typeof error === 'object') {
            if ('message' in error && typeof (error as Error).message === 'string') {
                errorMessage = (error as Error).message;
            }
            if ('stack' in error && typeof (error as Error).stack === 'string') {
                errorStack = (error as Error).stack;
            }
            if ('status' in error) {
                errorStatus = (error as { status?: unknown }).status;
            }
        }

        console.error('Detailed error:', {
            message: errorMessage,
            stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
            status: errorStatus,
        });

        return NextResponse.json(
            {
                error: 'Failed to fetch events',
                message: errorMessage,
                ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
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