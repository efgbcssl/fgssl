/* eslint-disable @typescript-eslint/no-explicit-any */
// GET /api/dashboard/resources?type=audio|pdf|document|video
// (List from MongoDB)
import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Resource from '@/models/Resource';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    try {
        await connectMongoDB();
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');

        const query: any = {};
        if (type) query.type = type;

        // You can add pagination here if you want
        const resources = await Resource.find(query).sort({ createdAt: -1 }).lean();

        // Normalize shape for the dashboard
        const normalized = resources.map((r: any) => ({
            _id: r._id?.toString(),
            fileId: r.fileId || r._id?.toString(),
            name: r.name,
            type: r.type,
            url: r.url,
            downloadable: r.downloadable,
            uploadedAt: r.uploadedAt || r.createdAt,
            date: r.createdAt,
            size: r.size || 0,
            youtubeId: r.youtubeId,
            youtubeMetadata: r.youtubeMetadata,
            featured: r.featured,
            description: r.description,
            tags: r.tags || [],
            category: r.category,
            mime: r.mime,
        }));

        return NextResponse.json(normalized);
    } catch (err: any) {
        console.error('GET /resources error', err);
        return NextResponse.json({ error: err.message || 'Failed to fetch resources' }, { status: 500 });
    }
}
