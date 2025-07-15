// app/api/dashboard/resources/youtube/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import getServerSession from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
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

        // Parse the multipart form data
        const formData = await request.formData();

        const videoFile = formData.get('video') as File;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const tags = formData.get('tags') as string;
        const privacyStatus = formData.get('privacyStatus') as string;
        const thumbnail = formData.get('thumbnail') as File;

        if (!videoFile) {
            return NextResponse.json(
                { error: 'No video file provided' },
                { status: 400 }
            );
        }

        if (!title?.trim()) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

        // Initialize YouTube API
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        oauth2Client.setCredentials({
            access_token: session.accessToken,
            refresh_token: session.refreshToken,
        });

        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

        // Convert File to Buffer then to Readable stream
        const buffer = Buffer.from(await videoFile.arrayBuffer());
        const videoStream = new Readable();
        videoStream.push(buffer);
        videoStream.push(null);

        // Prepare video metadata
        const videoMetadata = {
            snippet: {
                title: title.trim(),
                description: description || '',
                tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            },
            status: {
                privacyStatus: privacyStatus || 'unlisted',
            },
        };

        // Upload video to YouTube
        const uploadResponse = await youtube.videos.insert({
            part: ['snippet', 'status'],
            requestBody: videoMetadata,
            media: {
                body: videoStream,
                mimeType: videoFile.type || 'video/mp4',
            },
        });

        const videoId = uploadResponse.data.id;

        // Upload custom thumbnail if provided
        if (thumbnail && videoId) {
            try {
                const thumbnailBuffer = Buffer.from(await thumbnail.arrayBuffer());
                const thumbnailStream = new Readable();
                thumbnailStream.push(thumbnailBuffer);
                thumbnailStream.push(null);

                await youtube.thumbnails.set({
                    videoId: videoId,
                    media: {
                        body: thumbnailStream,
                        mimeType: thumbnail.type,
                    },
                });
            } catch (thumbnailError) {
                console.error('Thumbnail upload failed:', thumbnailError);
                // Continue without failing the entire upload
            }
        }

        return NextResponse.json({
            success: true,
            videoId: videoId,
            url: `https://youtu.be/${videoId}`,
            message: 'Video uploaded successfully to YouTube',
        });

    } catch (error: any) {
        console.error('YouTube upload error:', error);

        // Handle specific YouTube API errors
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

        return NextResponse.json(
            { error: errorMessage },
            { status: statusCode }
        );
    }
}