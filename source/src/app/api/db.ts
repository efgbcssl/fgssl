/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest, NextApiResponse } from "next";
import { connectMongoDB } from "@/lib/mongodb";

// Example response type
interface ApiResponse {
    success: boolean;
    data?: any;
    error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
    try {
        await connectMongoDB();

        // Example: Add your MongoDB operations here
        // For now, just confirm connection
        res.status(200).json({ success: true, data: { message: "MongoDB connection successful" } });
    } catch (error: any) {
        console.error("API error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}