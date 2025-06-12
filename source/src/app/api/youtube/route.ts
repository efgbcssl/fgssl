import { NextResponse } from 'next/server'
import type { YouTubeVideo } from '@/types/youtube'

export const dynamic = 'force-dynamic' // Ensure dynamic fetch
export const revalidate = 0 // No cache

export async function GET() {
    const apiKey = process.env.YOUTUBE_API_KEY
    const channelId = process.env.YOUTUBE_CHANNEL_ID

    if (!apiKey || !channelId) {
        return NextResponse.json(
            { error: 'YouTube API not configured' },
            { status: 500 }
        )
    }

    try {
        // 1. Get the uploads playlist ID from channel
        const channelRes = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`
        )

        if (!channelRes.ok) throw new Error('Failed to fetch channel data')
        const channelData = await channelRes.json()

        const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads

        // 2. Get latest videos from uploads playlist
        const videosRes = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=2&playlistId=${uploadsPlaylistId}&key=${apiKey}`
        )

        if (!videosRes.ok) throw new Error('Failed to fetch videos')
        const videosData = await videosRes.json()

        // 3. Get video details (including duration) in batch
        const videoIds = videosData.items.map((item: any) => item.snippet.resourceId.videoId).join(',')
        const detailsRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${apiKey}`
        )

        if (!detailsRes.ok) throw new Error('Failed to fetch video details')
        const detailsData = await detailsRes.json()

        // 4. Format all data
        const videos: YouTubeVideo[] = detailsData.items.map((item: any) => {
            const duration = formatDuration(item.contentDetails.duration)

            return {
                id: item.id,
                title: item.snippet.title,
                description: item.snippet.description,
                thumbnailUrl: getBestThumbnail(item.snippet.thumbnails),
                duration,
                channelTitle: item.snippet.channelTitle,
                publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                }),
                viewCount: parseInt(item.statistics.viewCount).toLocaleString(),
                videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
                embedUrl: `https://www.youtube.com/embed/${item.id}?autoplay=1`,
            }
        })

        return NextResponse.json(videos)
    } catch (error) {
        console.error('YouTube API error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch YouTube videos' },
            { status: 500 }
        )
    }
}

// Helper to get the best thumbnail URL
function getBestThumbnail(thumbnails: any): string {
    return thumbnails.maxres?.url ||
        thumbnails.standard?.url ||
        thumbnails.high?.url ||
        '/default-video-thumbnail.jpg' // Place this in public folder
}

// Helper to format ISO 8601 duration (PT15M33S → 15:33)
function formatDuration(duration: string): string {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
    if (!match) return '0:00'

    const hours = (parseInt(match[1]) || 0)
    const minutes = (parseInt(match[2]) || 0)
    const seconds = (parseInt(match[3]) || 0)

    return hours > 0
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes}:${seconds.toString().padStart(2, '0')}`
}