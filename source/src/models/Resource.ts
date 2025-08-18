import mongoose, { Schema, InferSchemaType } from 'mongoose';

const ResourceSchema = new Schema({
    name: { type: String, required: true },

    type: { type: String, enum: ['audio', 'pdf', 'document', 'video'], required: true },

    // File storage (ImageKit / PDFs / Docs / Audio)
    url: { type: String },             // Original URL (for PDFs/Docs/Audio/Video fallback)
    fileId: { type: String },          // ImageKit file ID
    size: { type: Number },
    mime: String,

    downloadable: { type: Boolean, default: true },
    uploadedAt: { type: Date, default: () => new Date() },

    // YouTube fields
    youtubeId: { type: String },
    youtubeMetadata: {
        description: String,
        privacyStatus: { type: String, enum: ['public', 'unlisted', 'private'] },
        tags: [String],
        thumbnailUrl: String,
    },

    // === Derived / convenience fields for frontend ===
    thumbnail: { type: String },       // Direct thumbnail (fallback to youtubeMetadata.thumbnailUrl)
    fileUrl: { type: String },         // Alias for url (useful for ResourceCard.tsx)
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },

    // Categorization
    category: {
        type: String,
        enum: ['sermons', 'studies', 'events', 'music', 'other'],
        default: 'other'
    },
    featured: { type: Boolean, default: false },

    // Metadata
    description: String,
    tags: [String],
}, { timestamps: true });

export type ResourceDoc = InferSchemaType<typeof ResourceSchema>;
export default mongoose.models.Resource || mongoose.model('Resource', ResourceSchema);
