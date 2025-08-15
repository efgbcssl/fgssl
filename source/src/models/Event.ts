/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Document, Schema } from 'mongoose'

export interface IEvent extends Document {
    title: string
    description: string
    date: string
    time: string
    location: string
    imageSrc: string
    ctaText?: string
    ctaLink?: string
    order: number
    expiresAt: Date
    requiresRSVP: boolean
    isPaidEvent: boolean
    price?: number
    currency?: string
    stripePriceId?: string
    capacity?: number
    formSchema?: any
    createdAt: Date
    updatedAt: Date
}

const EventSchema = new Schema<IEvent>({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },
    imageSrc: { type: String, required: true },
    ctaText: { type: String },
    ctaLink: { type: String },
    order: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    requiresRSVP: { type: Boolean, default: false },
    isPaidEvent: { type: Boolean, default: false },
    price: { type: Number, min: 0 },
    currency: { type: String },
    stripePriceId: { type: String },
    capacity: { type: Number, min: 0 },
    formSchema: { type: Schema.Types.Mixed }
}, {
    timestamps: true
})

// Index for active events (not expired)
EventSchema.index({ expiresAt: 1 })
// Index for sorting
EventSchema.index({ order: 1 })

export const Event = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema)