/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/faqs/route.ts
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { connectMongoDB } from "@/lib/mongodb";
import { FaqModel } from "@/models/Faq";

// (Optional) If you’re deploying on Vercel and want to ensure dynamic behavior
// export const dynamic = "force-dynamic";

export async function GET() {
    try {
        await connectMongoDB();

        const faqs = await FaqModel.find({})
            .sort({ order: 1 })
            .lean();

        return NextResponse.json(faqs);
    } catch (error) {
        console.error("FAQ GET Error:", error);
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectMongoDB();

        const { question, answer } = await req.json();

        if (!question || !answer) {
            return NextResponse.json(
                { error: "Both 'question' and 'answer' are required." },
                { status: 400 }
            );
        }

        // Check if question already exists (soft guard)
        const existingFAQ = await FaqModel.findOne({ question }).lean();
        if (existingFAQ) {
            return NextResponse.json(
                { error: "This question already exists" },
                { status: 400 }
            );
        }

        // Find current highest order
        const lastItem = await FaqModel.findOne({}, { order: 1 })
            .sort({ order: -1 })
            .lean();

        const newOrder = typeof lastItem?.order === "number" ? lastItem.order + 1 : 0;

        const newFAQ = await FaqModel.create({
            faq_id: uuidv4(),
            question,
            answer,
            order: newOrder,
            // createdAt/updatedAt handled by timestamps
        });

        return NextResponse.json(newFAQ, { status: 201 });
    } catch (error: any) {
        // Handle race-condition duplicates gracefully (Mongo duplicate key error = 11000)
        if (error?.code === 11000) {
            if (error.keyPattern?.question) {
                return NextResponse.json(
                    { error: "This question already exists" },
                    { status: 400 }
                );
            }
            if (error.keyPattern?.faq_id) {
                return NextResponse.json(
                    { error: "FAQ ID duplication detected, please retry" },
                    { status: 409 }
                );
            }
        }

        console.error("FAQ POST Error:", error);
        return NextResponse.json({ error: "Failed to create FAQ" }, { status: 500 });
    }
}
