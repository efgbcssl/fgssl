/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server'
import { connectMongoDB } from '@/lib/mongodb'
import { Event } from '@/models/Event'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        await connectMongoDB()
        const now = new Date()

        console.log('Fetching events with filter:', { expiresAt: { $gt: now } })

        const events = await Event.find({ expiresAt: { $gt: now } })
            .sort({ order: 'asc' })
            .lean()

        console.log('events', events)
        if (!events || events.length === 0) {
            return NextResponse.json([], {
                headers: {
                    'Access-Control-Allow-Origin': '*'
                }
            })
        }

        // Clean the data before returning
        const cleanedEvents = events.map((event) => ({
            id: event._id.toString(),
            title: event.title,
            description: event.description,
            date: event.date,
            time: event.time,
            location: event.location,
            imageSrc: event.imageSrc,
            ctaText: event.ctaText,
            ctaLink: event.ctaLink,
            order: event.order,
            expiresAt: event.expiresAt,
            requiresRSVP: event.requiresRSVP,
            isPaidEvent: event.isPaidEvent,
            price: event.price,
            currency: event.currency,
            capacity: event.capacity
        }))

        const response = NextResponse.json(cleanedEvents)
        response.headers.set('Access-Control-Allow-Origin', '*')

        return response
    } catch (error) {
        let errorMessage = 'Unknown error'
        let errorStack: string | undefined = undefined
        let errorStatus: unknown = undefined

        if (error && typeof error === 'object') {
            if ('message' in error && typeof (error as Error).message === 'string') {
                errorMessage = (error as Error).message
            }
            if ('stack' in error && typeof (error as Error).stack === 'string') {
                errorStack = (error as Error).stack
            }
            if ('status' in error) {
                errorStatus = (error as { status?: unknown }).status
            }
        }

        console.error('Detailed error:', {
            message: errorMessage,
            stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
            status: errorStatus,
        })

        return NextResponse.json(
            {
                error: 'Failed to fetch events',
                message: errorMessage,
                ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
            },
            {
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                }
            }
        )
    }
}

export async function POST(request: Request) {
    try {
        await connectMongoDB()
        const data = await request.json()

        const {
            stripePriceId,
            requiresRSVP = false,
            isPaidEvent = false,
            price = 0,
            currency = 'USD',
            capacity = 0,
            formSchema,
            date,
            ...restData
        } = data

        const eventDate = new Date(data.date)
        const expiresAt = new Date(eventDate.getTime() + 15 * 24 * 60 * 60 * 1000)

        const eventData = {
            ...restData,
            date,
            expiresAt,
            requiresRSVP,
            isPaidEvent,
            price: isPaidEvent ? price : undefined,
            currency: isPaidEvent ? currency : undefined,
            stripePriceId: isPaidEvent ? stripePriceId : undefined,
            capacity: requiresRSVP ? capacity : undefined,
            formSchema: requiresRSVP ? formSchema : undefined
        }

        console.log('Creating event with data:', eventData)

        const newEvent = await Event.create(eventData)

        // Convert to plain object and clean up the response
        const responseData = newEvent.toObject()
        const { _id, __v, ...cleanedData } = responseData
        const finalResponse = { id: _id.toString(), ...cleanedData }

        return NextResponse.json(finalResponse, {
            status: 201,
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        })
    } catch (error) {
        console.error('Error creating event: ', error)
        return NextResponse.json(
            {
                error: 'Failed to create event',
                details: error instanceof Error ? error.message : String(error)
            },
            {
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                }
            }
        )
    }
}