import { NextResponse } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import { Event } from '@/models/Event'

export async function PUT(request: Request) {
    try {
        await connectMongoDB()
        const events = await request.json()

        // Create a bulk write operation for better performance
        const bulkOps = events.map((event: { id: string; order: number }) => ({
            updateOne: {
                filter: { _id: event.id },
                update: { $set: { order: event.order } }
            }
        }))

        // Execute all updates in a single operation
        const result = await Event.bulkWrite(bulkOps)

        if (!result.modifiedCount) {
            throw new Error('No events were updated')
        }

        return NextResponse.json({
            success: true,
            updatedCount: result.modifiedCount
        })
    } catch (error) {
        console.error('Error reordering events:', error)
        return NextResponse.json(
            {
                error: 'Failed to reorder events',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}