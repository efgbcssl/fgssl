/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { FaqModel } from "@/models/Faq";

interface FAQParams {
    params: { faq_id: string };
}

// ✅ Update FAQ
export async function PUT(
    req: Request,
    context: { params: Promise<{ faq_id: string }> }
) {
    const { params } = context;
    const { faq_id: faqId } = await params;

    try {
        await connectMongoDB();

        const { question, answer, order } = await req.json();

        if (!question?.trim() || !answer?.trim()) {
            return NextResponse.json(
                { error: "Both question and answer are required" },
                { status: 400 }
            );
        }

        // Check if the question already exists in another FAQ
        const existingFAQ = await FaqModel.findOne({ question }).lean();
        if (existingFAQ && existingFAQ.faq_id !== faqId) {
            return NextResponse.json(
                { error: "This question already exists in another FAQ" },
                { status: 400 }
            );
        }

        // Update FAQ
        const updatedFAQ = await FaqModel.findOneAndUpdate(
            { faq_id: faqId },
            { $set: { question, answer, order } },
            { new: true }
        );

        if (!updatedFAQ) {
            return NextResponse.json(
                { error: "FAQ not found or update failed" },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedFAQ);
    } catch (error) {
        console.error("PUT /api/faq/:faq_id error:", error);
        return NextResponse.json(
            { error: "Failed to update FAQ" },
            { status: 500 }
        );
    }
}

// ✅ Delete FAQ
export async function DELETE(
    req: Request,
    context: { params: Promise<{ faq_id: string }> }
) {
    const { params } = context;
    const { faq_id: faqId } = await params;

    try {
        await connectMongoDB();

        const existingFAQ = await FaqModel.findOne({ faq_id: faqId }).lean();
        if (!existingFAQ) {
            return NextResponse.json(
                { error: "FAQ not found" },
                { status: 404 }
            );
        }

        await FaqModel.deleteOne({ faq_id: faqId });

        return NextResponse.json({ message: "FAQ deleted successfully" });
    } catch (error) {
        console.error("DELETE /api/faq/:faq_id error:", error);
        return NextResponse.json(
            { error: "Failed to delete FAQ" },
            { status: 500 }
        );
    }
}
