import { NextResponse } from 'next/server'
import { xata } from '@/lib/xata'

export async function POST(req: Request) {
    try {
        const { reorderedFAQs } = await req.json()

        const updates = reorderedFAQs.map((faq: { faq_id: string, order: number }) => ({
            faq_id: faq.faq_id,
            order: faq.order
        }))

        await xata.db.faqs.update(updates)

        return NextResponse.json({ message: 'FAQs reordered successfully' })
    } catch {
        return NextResponse.json(
            { error: 'Failed to reorder FAQs' },
            { status: 500 }
        )
    }
}