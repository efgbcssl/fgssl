/*import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Readable } from 'stream';

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.accessToken) {
            return NextResponse.json(
                { error: 'Unauthorized - Please sign in with Google' },
                { status: 401 }
            );
        }

        const formData = await request.formData();

        const videoFile = formData.get('video') as File;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const tags = formData.get('tags') as string;
        const privacyStatus = formData.get('privacyStatus') as string;
        const thumbnail = formData.get('thumbnail') as File;

        if (!videoFile) {
            return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
        }

        if (!title?.trim()) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );

        oauth2Client.setCredentials({
            access_token: session.accessToken,
            refresh_token: session.refreshToken,
        });

        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

        // Read file into buffer
        const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
        const fileSize = videoBuffer.length;

        // Use the built-in Google resumable upload
        const res = await youtube.videos.insert(
            {
                part: ['snippet', 'status'],
                requestBody: {
                    snippet: {
                        title: title.trim(),
                        description: description || '',
                        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
                    },
                    status: {
                        privacyStatus: privacyStatus || 'unlisted',
                    },
                },
                media: {
                    mimeType: videoFile.type || 'video/*',
                    body: ReadableStreamFromBuffer(videoBuffer, (bytesUploaded) => {
                        const progress = ((bytesUploaded / fileSize) * 100).toFixed(2);
                        console.log(`Upload progress: ${progress}%`);
                    }),
                },
            },
            {
                // These headers help enable resumable behavior
                onUploadProgress: (evt) => {
                    const progress = ((evt.bytesRead / fileSize) * 100).toFixed(2);
                    console.log(`Upload progress: ${progress}%`);
                },
            }
        );

        const videoId = res.data.id;

        // Upload thumbnail
        if (thumbnail && videoId) {
            try {
                const thumbBuffer = Buffer.from(await thumbnail.arrayBuffer());
                await youtube.thumbnails.set({
                    videoId: videoId,
                    media: {
                        body: ReadableStreamFromBuffer(thumbBuffer),
                        mimeType: thumbnail.type,
                    },
                });
            } catch (err) {
                console.error('Thumbnail upload failed:', err);
            }
        }

        return NextResponse.json({
            success: true,
            videoId,
            url: `https://youtu.be/${videoId}`,
            message: 'Video uploaded successfully with resumable upload.',
        });

    } catch (error: any) {
        console.error('YouTube upload error:', error);

        let errorMessage = 'Failed to upload video';
        let statusCode = 500;

        if (error.code === 401 || error.status === 401) {
            errorMessage = 'Authentication expired - please reconnect your YouTube account';
            statusCode = 401;
        } else if (error.code === 403) {
            errorMessage = 'YouTube API quota exceeded or insufficient permissions';
            statusCode = 403;
        } else if (error.errors && Array.isArray(error.errors)) {
            errorMessage = error.errors.map((e: any) => e.message).join(', ');
            statusCode = error.code || 400;
        } else if (error.message) {
            errorMessage = error.message;
        }

        return NextResponse.json({ error: errorMessage }, { status: statusCode });
    }
}

function ReadableStreamFromBuffer(buffer: Buffer, onChunk?: (bytes: number) => void): Readable {
    let offset = 0;

    return new Readable({
        read(size) {
            const chunk = buffer.slice(offset, offset + size);
            this.push(chunk.length > 0 ? chunk : null);
            offset += size;
            if (onChunk) onChunk(offset);
        }
    });
}*/