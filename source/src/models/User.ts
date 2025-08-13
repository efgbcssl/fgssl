// src/models/User.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
    id: string; // UUID from NextAuth logic (optional if you want to keep separate from _id)
    email: string;
    name: string;
    image?: string | null;
    role: string;
    phone?: string | null;
    emailVerified?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Define schema
const UserSchema = new Schema<IUser>(
    {
        id: { type: String, required: true, unique: true }, // Your custom UUID
        email: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        image: { type: String, default: null },
        role: { type: String, default: "member" },
        phone: { type: String, default: null },
        emailVerified: { type: Date, default: null },
    },
    {
        timestamps: true, // automatically creates createdAt & updatedAt
    }
);

// Avoid model overwrite in dev
export const UserModel: Model<IUser> =
    (mongoose.models && mongoose.models.User) || mongoose.model<IUser>("User", UserSchema);
