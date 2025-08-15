import mongoose, { Document, Schema } from 'mongoose';

export interface IFailedAttachment extends Document {
    invoiceId: string;
    error: string;
    retryCount: number;
    createdAt: Date;
}

const FailedAttachmentSchema: Schema = new Schema({
    invoiceId: {
        type: String,
        required: true,
        index: true
    },
    error: {
        type: String,
        required: true
    },
    retryCount: {
        type: Number,
        required: true,
        default: 0
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    }
});

// Add compound index if needed
FailedAttachmentSchema.index({ invoiceId: 1, createdAt: -1 });

export default mongoose.models.FailedAttachment ||
    mongoose.model<IFailedAttachment>('FailedAttachment', FailedAttachmentSchema);