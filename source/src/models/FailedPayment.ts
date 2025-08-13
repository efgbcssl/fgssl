/* eslint-disable @typescript-eslint/no-unused-vars */
import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface IFailedPayment extends Document {
    customerEmail: string;
    customerName: string;
    amount: number;
    currency: string;
    invoiceId: string;
    subscriptionId?: string | null;
    failureReason: string;
    nextRetryDate?: Date | null;
    isRecurring: boolean;
    createdAt: Date;   // explicit field to keep your semantics
    resolved?: boolean;
    resolvedAt?: Date | null;
    updatedAt: Date;
}

const FailedPaymentSchema = new Schema<IFailedPayment>(
    {
        customerEmail: { type: String, required: true, index: true },
        customerName: { type: String, required: true },
        amount: { type: Number, required: true },
        currency: { type: String, required: true },
        invoiceId: { type: String, required: true, index: true },
        subscriptionId: { type: String, default: null, index: true },
        failureReason: { type: String, required: true },
        nextRetryDate: { type: Date, default: null },
        isRecurring: { type: Boolean, required: true },
        createdAt: { type: Date, required: true }, // keep distinct from schema timestamps
        resolved: { type: Boolean, default: false },
        resolvedAt: { type: Date, default: null },
    },
    { timestamps: { createdAt: 'tsCreatedAt', updatedAt: true } }
);

FailedPaymentSchema.index({ resolved: 1 });

export default models.FailedPayment || model<IFailedPayment>('FailedPayment', FailedPaymentSchema);
