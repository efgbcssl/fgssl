/* eslint-disable @typescript-eslint/no-unused-vars */
import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface IDonation extends Document {
    donorsId?: string | null;
    amount: number;
    currency: string;
    donationType: string;
    frequency?: string | null;
    donorName: string;
    donorEmail: string;
    donorPhone?: string | null;
    paymentMethod: string;
    paymentStatus: string;
    isRecurring: boolean;
    stripePaymentIntentId?: string;
    stripeChargeId?: string | null;
    stripeSubscriptionId?: string | null;
    receiptUrl?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

const DonationSchema = new Schema<IDonation>(
    {
        donorsId: { type: String, default: null, index: true },
        amount: { type: Number, required: true },
        currency: { type: String, required: true },
        donationType: { type: String, required: true },
        frequency: { type: String, default: null },
        donorName: { type: String, required: true },
        donorEmail: { type: String, required: true, index: true },
        donorPhone: { type: String, default: null },
        paymentMethod: { type: String, required: true },
        paymentStatus: { type: String, required: true },
        isRecurring: { type: Boolean, required: true, index: true },
        stripePaymentIntentId: { type: String, index: true },
        stripeChargeId: { type: String, default: null, index: true },
        stripeSubscriptionId: { type: String, default: null, index: true },
        receiptUrl: { type: String, default: null },
    },
    { timestamps: true }
);

DonationSchema.index({ donorEmail: 1, createdAt: -1 });

export default models.Donation || model<IDonation>('Donation', DonationSchema);
