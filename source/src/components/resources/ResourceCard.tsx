'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Download,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  ExternalLink,
  FileText,
  Music,
  Video,
  Clock,
  Calendar,
  User,
  Tag,
  Star,
  Eye
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { Resource } from '@/types/resources'

interface ResourceCardProps {
  resource: Resource
  variant?: 'grid' | 'list'
  showCategory?: boolean
  showStats?: boolean
  onPlay?: (resource: Resource) => void
  onDownload?: (resource: Resource) => void
}

export default function ResourceCard({
  resource,
  variant = 'grid',
  showCategory = true,
  showStats = false,
  onPlay,
  onDownload
}: ResourceCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [progress, setProgress] = useState(0)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />
      case 'audio':
        return <Music className="h-4 w-4" />
      case 'pdf':
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-red-500 hover:bg-red-600'
      case 'audio':
        return 'bg-blue-500 hover:bg-blue-600'
      case 'pdf':
        return 'bg-green-500 hover:bg-green-600'
      default:
        return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
    if (onPlay) {
      onPlay(resource)
    }
  }

  const handleDownload = () => {
    if (onDownload) {
      onDownload(resource)
    } else if (resource.downloadable) {
      const downloadUrl = resource.type === 'video' 
        ? resource.videoUrl 
        : resource.fileUrl
      window.open(downloadUrl, '_blank')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (variant === 'list') {
    return (
      <Card className="flex flex-row overflow-hidden hover:shadow-md transition-shadow">
        <div className="relative w-32 h-24 flex-shrink-0">
          {resource.thumbnail ? (
            <Image
              src={resource.thumbnail}
              alt={resource.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              {getTypeIcon(resource.type)}
            </div>
          )}
          <div className="absolute top-2 left-2">
            <Badge className={cn('text-white text-xs', getTypeColor(resource.type))}>
              {resource.type.toUpperCase()}
            </Badge>
          </div>
        </div>

        <div className="flex-1 p-4 flex justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg truncate pr-2">{resource.title}</h3>
              {resource.featured && (
                <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
              )}
            </div>
            
            {resource.description && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {resource.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-2">
              <span className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(resource.date)}
              </span>
              {resource.duration && (
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {resource.duration}
                </span>
              )}
              {(resource.type === 'pdf' || resource.type === 'audio') && resource.fileSize && (
                <span>{formatFileSize(resource.fileSize)}</span>
              )}
            </div>

            {showCategory && resource.category && (
              <Badge variant="outline" className="mb-2">
                {resource.category}
              </Badge>
            )}
          </div>

          <div className="flex flex-col gap-2 ml-4">
            <Button
              size="sm"
              onClick={handlePlayPause}
              className={cn('flex items-center gap-2', getTypeColor(resource.type))}
            >
              {resource.type === 'video' ? (
                <>
                  <Play className="h-4 w-4" />
                  Watch
                </>
              ) : resource.type === 'audio' ? (
                <>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  View
                </>
              )}
            </Button>

            {resource.downloadable && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative aspect-video w-full overflow-hidden">
        {resource.thumbnail ? (
          <Image
            src={resource.thumbnail}
            alt={resource.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="text-gray-400 text-4xl">
              {getTypeIcon(resource.type)}
            </div>
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
        
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className={cn('text-white text-xs', getTypeColor(resource.type))}>
            {getTypeIcon(resource.type)}
            <span className="ml-1">{resource.type.toUpperCase()}</span>
          </Badge>
          {resource.featured && (
            <Badge className="bg-yellow-500 text-white text-xs">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>

        {resource.duration && (
          <div className="absolute bottom-3 right-3">
            <Badge variant="secondary" className="text-xs bg-black/70 text-white">
              <Clock className="h-3 w-3 mr-1" />
              {resource.duration}
            </Badge>
          </div>
        )}

        {/* Play overlay for videos */}
        {resource.type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="lg"
              onClick={handlePlayPause}
              className="rounded-full bg-white/90 text-black hover:bg-white h-16 w-16"
            >
              <Play className="h-8 w-8 ml-1" />
            </Button>
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-lg leading-tight line-clamp-2 flex-1">
            {resource.title}
          </h3>
        </div>
        
        {resource.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {resource.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0 pb-3">
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
          <span className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(resource.date)}
          </span>
          {(resource.type === 'pdf' || resource.type === 'audio') && resource.fileSize && (
            <span>{formatFileSize(resource.fileSize)}</span>
          )}
        </div>

        {showCategory && resource.category && (
          <Badge variant="outline" className="mb-3">
            <Tag className="h-3 w-3 mr-1" />
            {resource.category}
          </Badge>
        )}

        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {resource.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {resource.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{resource.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Audio player for audio resources */}
        {resource.type === 'audio' && (
          <div className="mt-3">
            <audio
              controls
              className="w-full h-10"
              preload="metadata"
            >
              <source src={resource.fileUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {/* PDF preview for PDF resources */}
        {resource.type === 'pdf' && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full mt-3">
                <Eye className="h-4 w-4 mr-2" />
                Quick Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>{resource.title}</DialogTitle>
                <DialogDescription>PDF Preview</DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-hidden">
                <iframe
                  src={`${resource.fileUrl}#view=FitH`}
                  className="w-full h-96 border rounded-md"
                  title={resource.title}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>

      <CardFooter className="pt-0 flex gap-2">
        <Button
          onClick={handlePlayPause}
          className={cn('flex-1', getTypeColor(resource.type))}
        >
          {resource.type === 'video' ? (
            <>
              <Play className="h-4 w-4 mr-2" />
              Watch
            </>
          ) : resource.type === 'audio' ? (
            <>
              <Play className="h-4 w-4 mr-2" />
              Listen
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              View PDF
            </>
          )}
        </Button>

        {resource.downloadable && (
          <Button
            variant="outline"
            onClick={handleDownload}
            className="flex-shrink-0"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}

        {resource.type === 'video' && resource.youtubeId && (
          <Button
            variant="outline"
            onClick={() => window.open(`https://youtu.be/${resource.youtubeId}`, '_blank')}
            className="flex-shrink-0"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}