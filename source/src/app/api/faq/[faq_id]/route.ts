/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server'
import { xata } from '@/lib/xata'
import { toast } from '@/hooks/use-toast'

interface FAQParams {
    params: {
        faq_id: string
    }
}

// ✅ Update FAQ
export async function PUT(req: Request, context: Promise<FAQParams>) {
    const { params } = await context
    const { faq_id: faqId } = await params

    try {
        const { question, answer, order } = await req.json()

        if (!question?.trim() || !answer?.trim()) {
            return NextResponse.json(
                { error: 'Both question and answer are required' },
                { status: 400 }
            )
        }

        // Optional: Check if same question already exists in another FAQ
        const existingFAQ = await xata.db.faqs
            .filter({ question })
            .getFirst()

        if (existingFAQ && existingFAQ.faq_id !== faqId) {
            return NextResponse.json(
                { error: 'This question already exists in another FAQ' },
                { status: 400 }
            )
        }
        console.log('Updating FAQ with ID:', faqId)


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
        console.error('PUT /api/faq/:faq_id error:', error)
        return NextResponse.json(
            { error: 'Failed to update FAQ' },
            { status: 500 }
        )
    }
}

// ✅ Delete FAQ
export async function DELETE(req: Request, context: Promise<FAQParams>) {
    const { params } = await context
    const { faq_id: faqId } = await params

    try {
        const existingFAQ = await xata.db.faqs
            .filter({ faq_id: faqId })
            .getFirst()

        if (!existingFAQ) {
            return NextResponse.json(
                { error: 'FAQ not found' },
                { status: 404 }
            )
        }

        await xata.db.faqs.delete(faqId)

        return NextResponse.json({ message: 'FAQ deleted successfully' })
    } catch (error) {
        console.error('DELETE /api/faq/:faq_id error:', error)
        return NextResponse.json(
            { error: 'Failed to delete FAQ' },
            { status: 500 }
        )
    }
}
