/* eslint-disable @typescript-eslint/no-explicit-any */
// ✅ Updated API: src/app/api/resources/route.ts
import { NextResponse } from 'next/server'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const PLAYLIST_ID = process.env.YOUTUBE_PLAYLIST_ID;
const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY;

const fetchAllPlaylistItems = async (): Promise<any[]> => {
    let nextPageToken = '';
    const items: any[] = [];

    do {
        const res = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${PLAYLIST_ID}&key=${YOUTUBE_API_KEY}&pageToken=${nextPageToken}`
        );
        const data = await res.json();
        if (data?.items?.length) items.push(...data.items);
        nextPageToken = data.nextPageToken || '';
    } while (nextPageToken);

    return items;
};

const extractDuration = (iso: string) => {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const match = iso.match(regex);
    if (!match) return '0:00';
    const [, h, m, s] = match.map(Number);
    return h ? `${h}:${String(m || 0).padStart(2, '0')}:${String(s || 0).padStart(2, '0')}` : `${m || 0}:${String(s || 0).padStart(2, '0')}`;
};

const fetchImageKitResources = async () => {
    try {
        const res = await fetch(`https://api.imagekit.io/v1/files?fileType=all&limit=100`, {
            headers: {
                Authorization: `Basic ${Buffer.from(IMAGEKIT_PRIVATE_KEY + ':').toString('base64')}`
            }
        });
        const files = await res.json();
        return files.map((file: any) => {
            const ext = file.name.split('.').pop().toLowerCase();
            let type = null;
            if (['mp3', 'wav', 'm4a'].includes(ext)) type = 'audio';
            if (ext === 'pdf') type = 'pdf';

            return type ? {
                id: file.fileId,
                title: file.name,
                type,
                thumbnail: file.thumbnailUrl || '/placeholder-thumbnail.png',
                previewUrl: file.url,
                downloadUrl: file.url,
                canDownload: true,
                date: new Date(file.createdAt).toISOString(),
            } : null;
        }).filter(Boolean);
    } catch (err) {
        console.error('ImageKit fetch failed:', err);
        return [];
    }
};

export async function GET() {
    try {
        const playlistItems = await fetchAllPlaylistItems();
        const videos = playlistItems.filter((item: any) => item.snippet?.resourceId?.videoId).map((item: any) => ({
            id: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails?.high?.url || '',
            date: item.snippet.publishedAt,
            previewUrl: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
            type: 'video'
        }));

        const ids = videos.map((v) => v.id).filter(Boolean);
        const chunks = Array.from({ length: Math.ceil(ids.length / 50) }, (_, i) => ids.slice(i * 50, i * 50 + 50));
        const durations: Record<string, string> = {};

        for (const chunk of chunks) {
            const metaRes = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${chunk.join(',')}&key=${YOUTUBE_API_KEY}`
            );
            const metaData = await metaRes.json();
            metaData.items.forEach((item: any) => {
                durations[item.id] = extractDuration(item.contentDetails.duration);
            });
        }

        const enrichedVideos = videos.map((video) => ({
            ...video,
            duration: durations[video.id] || '0:00',
            canDownload: false,
            downloadUrl: '',
        }));

        const mediaResources = await fetchImageKitResources();

        return NextResponse.json([...enrichedVideos, ...mediaResources]);
    } catch (error) {
        console.error('Resources fetch failed:', error);
        return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
    }
}
