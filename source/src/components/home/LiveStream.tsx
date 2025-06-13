'use client'

import { useState, useEffect } from 'react'
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LiveStream } from '@/types/stream'

export default function LiveStream() {
    const [streams, setStreams] = useState<LiveStream[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const checkStreams = async () => {
        setLoading(true)
        setError(null)

        try {
            const [youtubeRes, facebookRes] = await Promise.allSettled([
                fetch('/api/streams/youtube'),
                fetch('/api/streams/facebook')
            ])

            const newStreams: LiveStream[] = []

            // Process YouTube response
            if (youtubeRes.status === 'fulfilled' && youtubeRes.value.ok) {
                const data = await youtubeRes.value.json()
                if (data.isLive) {
                    newStreams.push({
                        ...data,
                        platform: 'youtube',
                        lastChecked: Date.now()
                    })
                }
            }

            // Process Facebook response
            if (facebookRes.status === 'fulfilled' && facebookRes.value.ok) {
                const data = await facebookRes.value.json()
                if (data.isLive) {
                    newStreams.push({
                        ...data,
                        platform: 'facebook',
                        lastChecked: Date.now()
                    })
                }
            }

            // Check if any previously active streams are still valid
            const gracePeriod = parseInt(process.env.NEXT_PUBLIC_STREAM_GRACE_PERIOD || '1800') * 1000
            const now = Date.now()

            streams.forEach(stream => {
                if (!newStreams.some(s => s.platform === stream.platform)) {
                    if (now - stream.lastChecked < gracePeriod) {
                        newStreams.push({
                            ...stream,
                            isLive: false,
                            error: 'Stream ended recently'
                        })
                    }
                }
            })

            setStreams(newStreams)
        } catch (err) {
            console.error('Stream check failed:', err)
            setError('Failed to check live streams')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        checkStreams()

        // Set up periodic checking
        const interval = setInterval(
            checkStreams,
            parseInt(process.env.NEXT_PUBLIC_STREAM_CHECK_INTERVAL || '300') * 1000
        )

        return () => clearInterval(interval)
    }, [])

    if (loading && streams.length === 0) {
        return (
            <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-church-primary" />
            </div>
        )
    }

    if (streams.length === 0) {
        return null
    }

    return (
        <section className="py-8">
            <div className="container-custom">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Live Streams</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={checkStreams}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                <div className={`grid gap-6 ${streams.length === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                    {streams.map((stream) => (
                        <div
                            key={`${stream.platform}-${stream.id}`}
                            className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden"
                        >
                            <div className="aspect-video w-full bg-black relative">
                                {stream.isLive ? (
                                    <iframe
                                        src={stream.embedUrl}
                                        className="w-full h-full"
                                        allowFullScreen
                                        allow="autoplay; encrypted-media; picture-in-picture"
                                        title={`${stream.platform} live stream`}
                                    />
                                ) : (
                                    <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center">
                                        <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
                                        <h3 className="text-xl font-bold mb-2">Stream Offline</h3>
                                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                                            {stream.error || 'The live stream has ended'}
                                        </p>
                                        {stream.videoUrl && (
                                            <Button asChild variant="outline">
                                                <a
                                                    href={stream.videoUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Watch Recording
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold mb-1">{stream.title}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                            {stream.platform} • {new Date(stream.startedAt || Date.now()).toLocaleString()}
                                        </p>
                                    </div>
                                    {stream.isLive && (
                                        <div className="flex items-center bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                                            <span className="relative flex h-2 w-2 mr-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                            </span>
                                            LIVE
                                        </div>
                                    )}
                                </div>

                                {stream.isLive && stream.viewerCount && (
                                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                                        {parseInt(stream.viewerCount).toLocaleString()} viewers
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}