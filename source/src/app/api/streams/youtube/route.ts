import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
        // Check for live streams
        const res = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${apiKey}`
        )

        const data = await res.json()

        if (!data.items || data.items.length === 0) {
            return NextResponse.json({ isLive: false })
        }

        const liveVideo = data.items[0]
        const videoId = liveVideo.id.videoId

        // Get more details
        const detailsRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=${videoId}&key=${apiKey}`
        )
        const details = await detailsRes.json()

        return NextResponse.json({
            isLive: true,
            id: videoId,
            title: liveVideo.snippet.title,
            thumbnailUrl: liveVideo.snippet.thumbnails.high.url,
            viewerCount: details.items[0]?.liveStreamingDetails?.concurrentViewers || '0',
            startedAt: liveVideo.snippet.publishedAt,
            embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
            videoUrl: `https://youtube.com/watch?v=${videoId}`,
            lastChecked: Date.now()
        })
    } catch (error) {
        console.error('YouTube live check failed:', error)
        return NextResponse.json(
            { error: 'Failed to check YouTube live status' },
            { status: 500 }
        )
    }
}