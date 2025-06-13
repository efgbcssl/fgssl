export interface LiveStream {
    id: string
    platform: 'youtube' | 'facebook'
    isLive: boolean
    title: string
    thumbnailUrl: string
    viewerCount?: string
    startedAt?: string
    embedUrl: string
    videoUrl: string
    lastChecked: number
    error?: string
}