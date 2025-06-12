/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Play, Youtube, Pause, Clock } from 'lucide-react'
import type { YouTubeVideo } from '@/types/youtube'

export default function VideoCard({ video }: { video: YouTubeVideo }) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isVisible, setIsVisible] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)

    // Intersection Observer for auto-pause
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting)
                if (!entry.isIntersecting && isPlaying) {
                    setIsPlaying(false)
                }
            },
            { threshold: 0.7 }
        )

        if (cardRef.current) observer.observe(cardRef.current)

        return () => observer.disconnect()
    }, [isPlaying])

    const togglePlay = () => {
        setIsPlaying(!isPlaying)
    }

    return (
        <div
            ref={cardRef}
            className="group relative overflow-hidden rounded-xl shadow-lg card-hover transition-all duration-300 hover:shadow-xl"
        >
            {/* Video Player or Thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden bg-black">
                {isPlaying ? (
                    <div className="h-full w-full">
                        <iframe
                            src={`${video.embedUrl}&enablejsapi=1&autoplay=1`}
                            className="h-full w-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={`YouTube video player for ${video.title}`}
                        />
                    </div>
                ) : (
                    <>
                        <Image
                            src={video.thumbnailUrl}
                            alt={`Thumbnail for ${video.title}`}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            priority
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

                        {/* Play Button */}
                        <button
                            onClick={togglePlay}
                            className="absolute inset-0 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-church-primary focus:ring-offset-2 rounded-xl"
                            aria-label={`Play ${video.title}`}
                        >
                            <div className="h-16 w-16 rounded-full bg-church-primary/90 flex items-center justify-center transform transition-transform duration-300 group-hover:scale-110 hover:bg-church-primary">
                                <Play fill="white" className="h-6 w-6 text-white ml-1" />
                            </div>
                        </button>
                    </>
                )}
            </div>

            {/* Video Info */}
            <div className="p-6 bg-white dark:bg-gray-900">
                <h3 className="font-heading text-xl font-bold mb-2 line-clamp-2 text-gray-900 dark:text-white">
                    {video.title}
                </h3>

                {/* Player Controls when playing */}
                {isPlaying ? (
                    <div className="flex justify-between items-center mb-3">
                        <button
                            onClick={togglePlay}
                            className="flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-church-primary dark:hover:text-church-primary transition-colors"
                        >
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                        </button>
                        <a
                            href={video.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-sm text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 transition-colors"
                        >
                            <Youtube className="h-4 w-4 mr-1" />
                            Watch on YouTube
                        </a>
                    </div>
                ) : (
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>{video.channelTitle}</span>
                        <span>{video.publishedAt}</span>
                    </div>
                )}

                {/* Video Stats */}
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                    <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {video.duration}
                    </span>
                    {video.viewCount && (
                        <span>{video.viewCount} views</span>
                    )}
                </div>
            </div>
        </div>
    )
}