import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
    const appId = process.env.FACEBOOK_APP_ID
    const appSecret = process.env.FACEBOOK_APP_SECRET
    const pageId = process.env.FACEBOOK_PAGE_ID

    if (!appId || !appSecret || !pageId) {
        return NextResponse.json(
            { error: 'Facebook API not configured' },
            { status: 500 }
        )
    }

    try {
        // Get access token
        const tokenRes = await fetch(
            `https://graph.facebook.com/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&grant_type=client_credentials`
        )
        const { access_token } = await tokenRes.json()

        // Check for live videos
        const res = await fetch(
            `https://graph.facebook.com/v18.0/${pageId}/live_videos?access_token=${access_token}&fields=status,title,description,embed_html,permalink_url,creation_time,live_views`
        )

        const data = await res.json()

        const liveStream = data.data?.find((stream: any) => stream.status === 'LIVE')

        if (!liveStream) {
            return NextResponse.json({ isLive: false })
        }

        return NextResponse.json({
            isLive: true,
            id: liveStream.id,
            title: liveStream.title || 'Live Stream',
            thumbnailUrl: `https://graph.facebook.com/${liveStream.id}/picture`,
            viewerCount: liveStream.live_views?.toString() || '0',
            startedAt: liveStream.creation_time,
            embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(liveStream.permalink_url)}&show_text=false`,
            videoUrl: liveStream.permalink_url,
            lastChecked: Date.now()
        })
    } catch (error) {
        console.error('Facebook live check failed:', error)
        return NextResponse.json(
            { error: 'Failed to check Facebook live status' },
            { status: 500 }
        )
    }
}