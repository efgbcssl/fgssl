/* eslint-disable @typescript-eslint/no-unused-vars */
import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface IDonor extends Document {
    donorsId?: string | null;
    name?: string;
    email: string;
    phone?: string | null;
    totalDonations?: number;
    lastDonationDate?: Date;
    donationFrequency?: string | null;
    hasActiveSubscription?: boolean;
    stripeCustomerId?: string | null;
    activeSubscriptionId?: string | null;
    subscriptionStartDate?: Date | null;
    subscriptionStatus?: string | null;
    subscriptionCancelledAt?: Date | null;
    lastUpdated: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const DonorSchema = new Schema<IDonor>(
    {
        donorsId: { type: String, default: null },
        name: { type: String },
        email: { type: String, required: true, unique: true, index: true },
        phone: { type: String, default: null },
        totalDonations: { type: Number, default: 0 },
        lastDonationDate: { type: Date },
        donationFrequency: { type: String, default: null },
        hasActiveSubscription: { type: Boolean, default: false },
        stripeCustomerId: { type: String, default: null, index: true },
        activeSubscriptionId: { type: String, default: null, index: true },
        subscriptionStartDate: { type: Date, default: null },
        subscriptionStatus: { type: String, default: null },
        subscriptionCancelledAt: { type: Date, default: null },
        lastUpdated: { type: Date, default: null },
    },
    { timestamps: true }
);

// Helpful compound indexes for queries you run frequently
DonorSchema.index({ email: 1 });
DonorSchema.index({ stripeCustomerId: 1 });
DonorSchema.index({ activeSubscriptionId: 1 });

export default models.Donor || model<IDonor>('Donor', DonorSchema);
