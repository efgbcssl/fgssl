"use client"

import { useState, useRef, useEffect } from "react"
import { Resource } from "@/types/resource"
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Download,
  ExternalLink,
  Play,
  Pause,
  FileText,
  Video,
  Music,
  Eye,
} from "lucide-react"
import Image from "next/image"

interface ResourceCardProps {
  resource: Resource
  onPreview?: (resource: Resource) => void
  onDownload?: (resource: Resource) => void
  showStats?: boolean
  variant: "grid" | "list"
  onPlay: (resource: Resource) => void
}

export default function ResourceCard({
  resource,
  onPreview,
  onDownload,
  showStats = false,
}: ResourceCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // sync audio events with state
  useEffect(() => {
    if (!audioRef.current) return
    const audio = audioRef.current
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)

    return () => {
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
    }
  }, [])

  // derive thumbnail
  const thumbnailUrl =
    resource.thumbnailUrl ||
    (resource.type === "video" && resource.youtubeId
      ? `https://img.youtube.com/vi/${resource.youtubeId}/hqdefault.jpg`
      : null)

  // derive icon
  const getIcon = () => {
    switch (resource.type) {
      case "pdf":
        return <FileText className="h-6 w-6 text-red-500" />
      case "audio":
        return <Music className="h-6 w-6 text-green-500" />
      case "video":
        return <Video className="h-6 w-6 text-blue-500" />
      default:
        return <ExternalLink className="h-6 w-6 text-gray-500" />
    }
  }

  // handle download
  const handleDownload = () => {
    if (onDownload) return onDownload(resource)
    if (!resource.downloadable) return

    let downloadUrl = ""
    if (resource.type === "pdf" || resource.type === "audio" || resource.type === "video") {
      downloadUrl = resource.thumbnailUrl || ""
    }
    if (resource.type === "video" && resource.youtubeId) {
      downloadUrl = `https://youtu.be/${resource.youtubeId}`
    }
    if (resource.type === "link") {
      downloadUrl = resource.url
    }

    if (downloadUrl) window.open(downloadUrl, "_blank")
  }

  // handle play/pause
  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
    } else {
      audioRef.current?.play()
      setIsPlaying(true)
    }
  }

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      {/* Thumbnail / Icon */}
      <CardHeader className="relative h-40 p-0">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={resource.title}
            fill
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-100">
            {getIcon()}
          </div>
        )}
      </CardHeader>

      {/* Content */}
      <CardContent className="flex-1 p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">
          {resource.title}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-2">
          {resource.description}
        </p>

        {/* Audio player */}
        {resource.type === "audio" && resource.audioUrl && (
          <div className="mt-3">
            <audio
              ref={audioRef}
              controls
              preload="metadata"
              className="w-full h-10"
            >
              <source src={resource.audioUrl} type="audio/mpeg" />
            </audio>
          </div>
        )}

        {/* Stats */}
        {showStats && (
          <div className="flex gap-4 text-xs text-gray-500 mt-3">
            {resource.views !== undefined && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" /> {resource.views}
              </span>
            )}
            {resource.downloads !== undefined && (
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" /> {resource.downloads}
              </span>
            )}
          </div>
        )}
      </CardContent>

      {/* Actions */}
      <CardFooter className="flex justify-between gap-2 p-4">
        {onPreview && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPreview(resource)}
            aria-label="Preview resource"
          >
            Preview
          </Button>
        )}

        {resource.type === "audio" ? (
          <Button
            size="sm"
            onClick={handlePlayPause}
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleDownload}
            disabled={!resource.downloadable}
            aria-label="Download resource"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
