import mongoose, { Document, Schema } from 'mongoose'

export interface IMessage extends Document {
    name: string
    email: string
    subject?: string
    message: string
    status: 'unread' | 'read' | 'archived'
    createdAt: Date
}

const MessageSchema = new Schema<IMessage>({
    name: { type: String, required: true, trim: true },
    email: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: (value: string) => {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
            },
            message: 'Invalid email format'
        }
    },
    subject: { type: String, default: 'No Subject', trim: true },
    message: { type: String, required: true, trim: true },
    status: {
        type: String,
        enum: ['unread', 'read', 'archived'],
        default: 'unread'
    },
    createdAt: { type: Date, default: Date.now }
})

// Create text index for search functionality
MessageSchema.index({ name: 'text', email: 'text', subject: 'text', message: 'text' })

export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema)