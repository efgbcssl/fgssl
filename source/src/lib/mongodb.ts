/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "default";

if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable in .env");
}

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

// Use globalThis for better TypeScript compatibility and to avoid `any`
let cached: MongooseCache = (globalThis as any).mongoose || { conn: null, promise: null };

if (!cached) {
    cached = (globalThis as any).mongoose = { conn: null, promise: null };
}

export async function connectMongoDB(): Promise<typeof mongoose> {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose
            .connect(MONGODB_URI, {
                // Optional: Add connection options if needed
                bufferCommands: false,
            })
            .then((mongooseInstance) => {
                console.log("MongoDB connected successfully");
                return mongooseInstance;
            })
            .catch((error) => {
                console.error("MongoDB connection error:", error);
                throw error;
            });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}