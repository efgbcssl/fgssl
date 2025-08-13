/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/mongodb.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable in .env");
}

/**
 * Global is used here to maintain a cached connection across hot reloads in dev.
 * This prevents connections growing exponentially during API route development.
 */
let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectMongoDB() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => mongoose);
    }

    cached.conn = await cached.promise;
    console.log("MongoDB connected successfully");
    return cached.conn;
}
