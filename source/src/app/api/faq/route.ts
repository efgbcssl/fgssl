import { NextResponse } from 'next/server'
import { xata } from '@/lib/xata'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
    try {
        const faqs = await xata.db.faqs
            .sort('order', 'asc')
            .getAll()
        return NextResponse.json(faqs)
    } catch (error) {
        console.error('FAQ GET Error:', error);
        return NextResponse.json(
            [],
            { status: 500 }
        )
    }
}

export async function POST(req: Request) {
    try {
        const { question, answer } = await req.json()

        // Check if question already exists
        const existingFAQ = await xata.db.faqs
            .filter({ question })
            .getFirst()

        if (existingFAQ) {
            return NextResponse.json(
                { error: 'This question already exists' },
                { status: 400 }
            )
        }

        // Get the current highest order value
        const lastItem = await xata.db.faqs
            .sort('order', 'desc')
            .select(['order'])
            .getFirst()

        const newOrder = lastItem?.order !== undefined ? lastItem.order + 1 : 0

        const newFAQ = await xata.db.faqs.create({
            faq_id: uuidv4(),
            question,
            answer,
            order: newOrder,
            createdAt: new Date().toISOString()
        })

        return NextResponse.json(newFAQ, { status: 201 })
    } catch (error) {
        console.error('FAQ POST Error:', error);
        return NextResponse.json(
            { error: 'Failed to create FAQ' },
            { status: 500 }
        )
    }
}