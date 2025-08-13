import { NextResponse } from "next/server";
import { z } from "zod";
import { connectMongoDB } from "@/lib/mongodb";
import { FaqModel } from "@/models/Faq";

const ReorderSchema = z.object({
    reorderedFAQs: z.array(
        z.object({
            faq_id: z.string().min(1),
            order: z.number().nonnegative(),
        })
    ),
});

export async function POST(req: Request) {
    try {
        await connectMongoDB();

        const body = await req.json();
        const parseResult = ReorderSchema.safeParse(body);

        if (!parseResult.success) {
            return NextResponse.json(
                {
                    error: "Invalid request format",
                    details: parseResult.error.flatten(),
                },
                { status: 400 }
            );
        }

        const updates = parseResult.data.reorderedFAQs;

        if (updates.length === 0) {
            return NextResponse.json(
                { error: "No FAQs to reorder" },
                { status: 400 }
            );
        }

        // 1. Get existing FAQ IDs
        const faqIds = updates.map((f) => f.faq_id);
        const existingRecords = await FaqModel.find(
            { faq_id: { $in: faqIds } },
            { faq_id: 1 }
        ).lean();

        const existingFaqIds = new Set(existingRecords.map((f) => f.faq_id));

        // 2. Verify all IDs exist
        for (const f of updates) {
            if (!existingFaqIds.has(f.faq_id)) {
                throw new Error(`FAQ ID ${f.faq_id} not found in DB`);
            }
        }

        // 3. Batch update using bulkWrite for efficiency
        const bulkOps = updates.map((f) => ({
            updateOne: {
                filter: { faq_id: f.faq_id },
                update: { $set: { order: f.order } },
            },
        }));

        await FaqModel.bulkWrite(bulkOps);

        return NextResponse.json({ message: "FAQs reordered successfully" });
    } catch (error) {
        console.error("FAQ reorder error:", error);
        return NextResponse.json(
            { error: "Failed to reorder FAQs" },
            { status: 500 }
        );
    }
}
