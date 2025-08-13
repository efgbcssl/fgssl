/* eslint-disable @typescript-eslint/no-unused-vars */
import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface ISubscriptionCancellation extends Document {
    subscriptionId: string;
    customerEmail: string;
    customerName: string;
    amount: number;
    currency: string;
    frequency: string;
    cancelledAt: Date;
    cancellationReason?: string;
    totalDonationsBeforeCancellation: number;
    voluntaryCancellation?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const SubscriptionCancellationSchema = new Schema<ISubscriptionCancellation>(
    {
        subscriptionId: { type: String, required: true, index: true },
        customerEmail: { type: String, required: true, index: true },
        customerName: { type: String, required: true },
        amount: { type: Number, required: true },
        currency: { type: String, required: true },
        frequency: { type: String, required: true },
        cancelledAt: { type: Date, required: true },
        cancellationReason: { type: String },
        totalDonationsBeforeCancellation: { type: Number, required: true },
        voluntaryCancellation: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default models.SubscriptionCancellation || model<ISubscriptionCancellation>('SubscriptionCancellation', SubscriptionCancellationSchema);
