import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error(
        "Please define the MONGODB_URI environment variable in .env.local", new Error
    );
}

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

// Extend the globalThis type properly for TypeScript
declare global {
    // For Node.js runtime
    // eslint-disable-next-line no-var
    var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.mongoose ?? { conn: null, promise: null };

if (!globalThis.mongoose) {
    globalThis.mongoose = cached;
}

export async function connectMongoDB(): Promise<typeof mongoose> {
    if (cached.conn && mongoose.connection.readyState === 1) {
        console.log("✅ Using existing MongoDB connection");
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
        };

        console.log("🔄 Creating new MongoDB connection...");

        cached.promise = mongoose
            .connect(MONGODB_URI!, opts)
            .then((mongooseInstance) => {
                console.log("✅ MongoDB connected successfully");
                console.log(`📍 Connected to database: ${mongooseInstance.connection.name}`);
                console.log(`🔗 Connection state: ${mongooseInstance.connection.readyState}`);
                return mongooseInstance;
            })
            .catch((error) => {
                console.error("❌ MongoDB connection error:", error);
                cached.promise = null;
                throw error;
            });
    }

    try {
        cached.conn = await cached.promise;
        return cached.conn;
    } catch (error) {
        cached.promise = null;
        throw error;
    }
}

export function getConnectionStatus(): string {
    const states = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
    };
    return states[mongoose.connection.readyState as keyof typeof states] || "unknown";
}

export async function disconnectMongoDB(): Promise<void> {
    if (cached.conn) {
        await mongoose.disconnect();
        cached.conn = null;
        cached.promise = null;
        console.log("🔌 MongoDB disconnected");
    }
}

export const runtime = "nodejs";
