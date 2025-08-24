import { Button } from '@/components/ui/button'
import VideoCard from './VideoCard'
import { Youtube } from 'lucide-react'
import type { YouTubeVideo } from '@/types/youtube'
import Link from 'next/link'

export const revalidate = Number(process.env.YOUTUBE_CACHE_DURATION) || 1800 // 30 minutes

async function fetchVideos(): Promise<YouTubeVideo[]> {
  try {
    // Handle both development and production environments
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : process.env.NEXT_PUBLIC_SITE_URL || ''

    // Validate the base URL
    if (!baseUrl) {
      throw new Error('Base URL is not configured')
    }

    const res = await fetch(`${baseUrl}/api/youtube`, {
      next: { revalidate: Number(process.env.YOUTUBE_CACHE_DURATION) || 1800 },
      signal: AbortSignal.timeout(8000) // 8 seconds
    })

    if (!res.ok) {
      throw new Error(`Failed to fetch videos: ${res.status} ${res.statusText}`)
    }

    return await res.json()
  } catch (error) {
    console.error('Fetch error:', error)
    return []
  }
}

export default async function LatestVideos() {
  let videos: YouTubeVideo[] = []

  try {
    videos = await fetchVideos()
  } catch (error) {
    console.log('Error in Latest Videos Component: ', error)
  }

  if (videos.length === 0) {
    return (
      <section className="py-16">
        <div className="container-custom text-center">
          <h2 className="section-title mb-6">Latest Videos</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {process.env.NODE_ENV === 'development'
              ? 'Videos not available (development mode)'
              : 'No videos available yet. Check back later!'}
          </p>
          <Button asChild variant="outline" className="border-church-primary text-church-primary">
            <Link href={process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL || 'https://youtube.com'}>
              Visit Our YouTube Channel
            </Link>
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16">
      <div className="container-custom">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10">
          <h2 className="section-title mb-4 sm:mb-0">Latest Videos</h2>
          <div className="flex gap-4">
            <Button asChild variant="outline" className="border-church-primary text-church-primary">
              <Link href="/resources">View All Videos</Link>
            </Button>
            <Button asChild variant="ghost" className="text-red-600 hover:bg-red-50 dark:text-red-500 dark:hover:bg-red-900/20">
              <Link
                href={process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL || '#'}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Youtube className="mr-2 h-4 w-4" />
                YouTube Channel
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </div>
    </section>
  )
}