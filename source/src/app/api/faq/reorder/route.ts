import { NextResponse } from 'next/server'
import { xata } from '@/lib/xata'
import { z } from 'zod'

const ReorderSchema = z.object({
    reorderedFAQs: z.array(
        z.object({
            faq_id: z.string().min(1),
            order: z.number().nonnegative()
        })
    )
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const parseResult = ReorderSchema.safeParse(body)

        if (!parseResult.success) {
            return NextResponse.json(
                { error: 'Invalid request format', details: parseResult.error.flatten() },
                { status: 400 }
            )
        }

        const updates = parseResult.data.reorderedFAQs

        if (updates.length === 0) {
            return NextResponse.json(
                { error: 'No FAQs to reorder' },
                { status: 400 }
            )
        }

        // 1. Fetch current records to get their faq_id
        const faqIds = updates.map(f => f.faq_id)
        const existingRecords = await xata.db.faqs
            .filter({ faq_id: { $any: faqIds } })
            .getAll()

        const faqIdMap = new Map(
            existingRecords.map(faq => [faq.faq_id, faq.xata_id])
        )

        // 2. Build valid updates with xata_id
        const finalUpdates = updates.map(f => {
            const xata_id = faqIdMap.get(f.faq_id)
            if (!xata_id) throw new Error(`FAQ ID ${f.faq_id} not found in DB`)
            return {
                xata_id,
                order: f.order,
            }
        })

        // 3. Batch update
        await xata.db.faqs.update(finalUpdates)

        return NextResponse.json({ message: 'FAQs reordered successfully' })
    } catch (error) {
        console.error('FAQ reorder error:', error)
        return NextResponse.json(
            { error: 'Failed to reorder FAQs' },
            { status: 500 }
        )
    }
}
