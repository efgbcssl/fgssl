/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse, NextRequest } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import { Event } from '@/models/Event'
import mongoose from 'mongoose'

interface EventDocument {
    _id: mongoose.Types.ObjectId
    date: Date
    expiresAt: Date

}

interface Params {
    id: string
}

type LeanEvent = EventDocument & { __v?: number }
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }  // Fixed signature
) {
    try {
        await connectMongoDB()
        const params = await context.params;  // Await the params
        const { id } = params

        // Validate the ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: 'Invalid event ID format' },
                { status: 400 }
            )
        }

        const data = await request.json()
        const eventDate = new Date(data.date)
        const expiresAt = new Date(eventDate.getTime() + 15 * 24 * 60 * 60 * 1000)

        // Prepare update data
        const updateData = {
            ...data,
            expiresAt
        }

        // Clean up undefined values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key]
            }
        })

        const updatedEvent = await Event.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).lean();

        if (!updatedEvent || Array.isArray(updatedEvent)) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            );
        }

        // Clean up the response - handle the lean() return type properly
        const responseData = {
            id: (updatedEvent as { _id: mongoose.Types.ObjectId })._id.toString(),
            ...updatedEvent
        };
        delete (responseData as any)._id;  // Remove the _id property
        delete (responseData as any).__v;   // Remove the __v property

        return NextResponse.json(responseData);

    } catch (error) {
        console.error('Error updating event:', error)
        return NextResponse.json(
            {
                error: 'Failed to update event',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }) {
    try {
        await connectMongoDB()
        const params = await context.params;  // Await the params
        const { id } = params
        // Validate the ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { error: 'Invalid event ID format' },
                { status: 400 }
            )
        }

        const deletedEvent = await Event.findByIdAndDelete(id)

        if (!deletedEvent) {
            return NextResponse.json(
                { error: 'Event not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            deletedId: id
        })

    } catch (error) {
        console.error('Error deleting event:', error)
        return NextResponse.json(
            {
                error: 'Failed to delete event',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}