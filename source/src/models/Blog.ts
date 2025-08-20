import mongoose, { Schema, Model } from "mongoose";

export interface IBlog extends mongoose.Document {
    tags: never[];
    post_id: string;
    title: string;
    slug: string;
    content?: string;
    excerpt?: string;
    status: "published" | "scheduled" | "draft";
    publishDate?: Date;
    categories: string[];
    likes: number;
    commentCount: number;
    featuredImage?: string;
    metaTitle?: string;
    metaDescription?: string;
    createdAt: Date;
    updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
    {
        post_id: { type: String, required: true, unique: true },
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        content: { type: String, default: "" },
        excerpt: { type: String, default: "" },
        status: {
            type: String,
            enum: ["published", "scheduled", "draft"],
            default: "draft",
        },
        publishDate: { type: Date },
        categories: [{ type: String }],
        likes: { type: Number, default: 0 },
        commentCount: { type: Number, default: 0 },
        featuredImage: { type: String },
        metaTitle: { type: String },
        metaDescription: { type: String },
    },
    { timestamps: true }
);

export const BlogModel: Model<IBlog> =
    mongoose.models.Blog || mongoose.model<IBlog>("Blog", BlogSchema);

export default BlogModel;
