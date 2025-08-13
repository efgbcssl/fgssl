// src/models/Faq.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFaq extends Document {
    faq_id: string;        // keep your external UUID
    question: string;
    answer: string;
    order: number;         // for sorting
    createdAt: Date;
    updatedAt: Date;
}

const FaqSchema = new Schema<IFaq>(
    {
        faq_id: { type: String, required: true, unique: true },
        question: { type: String, required: true, unique: true, trim: true },
        answer: { type: String, required: true },
        order: { type: Number, required: true, index: true },
    },
    {
        timestamps: true, // creates createdAt/updatedAt
        versionKey: false,
    }
);

// Helpful indexes (unique question is already set above)
FaqSchema.index({ order: 1 });

export const FaqModel: Model<IFaq> =
    mongoose.models.Faq || mongoose.model<IFaq>("Faq", FaqSchema);
