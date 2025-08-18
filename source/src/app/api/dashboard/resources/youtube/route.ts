/* eslint-disable @typescript-eslint/no-explicit-any */
// POST /api/dashboard/resources/youtube
// Uploads video to YouTube (OAuth2 refresh token), optional thumbnail, stores doc in Mongo
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { connectMongoDB } from '@/lib/mongodb';
import Resource from '@/models/Resource';

export const runtime = 'nodejs';
export const maxDuration = 60; // prevent extremely long requests from hanging the worker

function toBuffer(f: File) {
    return f.arrayBuffer().then((ab) => Buffer.from(ab));
}

function parseBool(v: FormDataEntryValue | null, def = false) {
    if (typeof v !== 'string') return def;
    return v === 'true' || v === '1';
}
function parseTags(v: FormDataEntryValue | null): string[] {
    if (!v || typeof v !== 'string') return [];
    return v
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
}

function getOAuth2Client() {
    const client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID!,
        process.env.GOOGLE_CLIENT_SECRET!,
        process.env.GOOGLE_REDIRECT_URI!
    );
    client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
    });
    return client;
}

export async function POST(req: Request) {
    try {
        await connectMongoDB();

        const form = await req.formData();
        const video = form.get('video') as File | null;
        const title = (form.get('title') as string) || '';
        const description = (form.get('description') as string) || '';
        const tags = parseTags(form.get('tags'));
        const privacyStatus = (form.get('privacyStatus') as string) || 'unlisted';
        const downloadable = parseBool(form.get('downloadable'), true);
        const category = ((form.get('category') as string) || 'other') as
            | 'sermons'
            | 'studies'
            | 'events'
            | 'music'
            | 'other';
        const featured = parseBool(form.get('featured'));
        const thumbnail = form.get('thumbnail') as File | null;

        if (!video) return NextResponse.json({ error: 'Missing video file' }, { status: 400 });
        if (!title.trim()) return NextResponse.json({ error: 'Missing title' }, { status: 400 });

        const oauth2Client = getOAuth2Client();
        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

        const videoBuffer = await toBuffer(video);

        // Upload video (resumable not necessary for small/medium; for very large, migrate to resumable)
        const insertRes = await youtube.videos.insert({
            part: ['snippet', 'status'],
            requestBody: {
                snippet: {
                    title: title.trim(),
                    description,
                    tags,
                    categoryId: '22', // People & Blogs (change if you need)
                },
                status: {
                    privacyStatus: privacyStatus as 'public' | 'unlisted' | 'private',
                    selfDeclaredMadeForKids: false,
                },
            },
            media: {
                body: Buffer.from(videoBuffer),
            },
        });

        const videoId = insertRes.data.id;
        if (!videoId) {
            return NextResponse.json({ error: 'YouTube did not return a video id' }, { status: 500 });
        }

        let thumbnailUrl: string | undefined;
        if (thumbnail) {
            const thumbBuffer = await toBuffer(thumbnail);
            await youtube.thumbnails.set({
                videoId,
                media: { body: Buffer.from(thumbBuffer) },
            });
            // Public thumbnails are served by YT; store a generic URL reference
            thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        }

        // Create DB record
        const doc = await Resource.create({
            name: title.trim(),
            type: 'video',
            url: `https://youtu.be/${videoId}`,
            youtubeId: videoId,
            youtubeMetadata: {
                description,
                privacyStatus,
                tags,
                thumbnailUrl,
            },
            downloadable,
            uploadedAt: new Date(),
            category,
            featured,
            description,
            tags,
            size: video.size,
            mime: video.type,
        });

        return NextResponse.json({
            videoId,
            _id: doc._id.toString(),
            name: doc.name,
            type: doc.type,
            url: doc.url,
            downloadable: doc.downloadable,
            uploadedAt: doc.uploadedAt,
            size: doc.size,
            featured: doc.featured,
            description: doc.description,
            tags: doc.tags,
            category: doc.category,
            youtubeMetadata: doc.youtubeMetadata,
        });
    } catch (err: any) {
        console.error('POST /resources/youtube error', err?.response?.data || err);
        // Common quota/auth hints
        const msg =
            typeof err?.message === 'string'
                ? err.message
                : 'Failed to upload video to YouTube';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
