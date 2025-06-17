/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server'
import { xata } from '@/lib/xata'

interface FAQParams {
    params: {
        faq_id: string
    }
}
// ✅ Update FAQ
export async function PUT(req: Request, { params }: { params: Promise<{ faq_id: string }> }) {
    const faqId = (await params).faq_id

    try {
        const { question, answer, order } = await req.json()

        if (!question || !answer) {
            return NextResponse.json(
                { error: 'Question and answer are required' },
                { status: 400 }
            )
        }

        const existingFAQ = await xata.db.faqs
            .filter({
                $all: [
                    { question: { $is: question } },
                    { faq_id: { $not: { $is: faqId } } }
                ]
            })
            .getFirst()

        if (existingFAQ) {
            return NextResponse.json(
                { error: 'This question already exists' },
                { status: 400 }
            )
        }

        const updatedFAQ = await xata.db.faqs.update(faqId, {
            question,
            answer,
            order,
        })

        if (!updatedFAQ) {
            return NextResponse.json(
                { error: 'FAQ not found or update failed' },
                { status: 404 }
            )
        }

        return NextResponse.json(updatedFAQ)
    } catch (error) {
        console.error('PUT FAQ error:', error)
        return NextResponse.json({ error: 'Failed to update FAQ' }, { status: 500 })
    }
}

// ✅ Delete FAQ
export async function DELETE(req: Request, { params }: { params: Promise<{ faq_id: string }> }) {
    const faqId = (await params).faq_id

    try {
        const record = await xata.db.faqs.delete(faqId)

        if (!record) {
            return NextResponse.json(
                { error: 'FAQ not found' },
                { status: 404 }
            )
        }
        return NextResponse.json({ message: 'FAQ deleted successfully' })
    } catch (error) {
        console.error('DELETE FAQ error:', error)
        return NextResponse.json({ error: 'Failed to delete FAQ' }, { status: 500 })
    }
}
