export interface BaseResource {
  id: string
  title: string
  description?: string
  thumbnail?: string
  date: string
  uploadedAt?: string
  size?: number
  tags?: string[]
  downloadable: boolean
  featured?: boolean
  category?: 'sermons' | 'studies' | 'events' | 'music' | 'other'
  createdBy?: string
  updatedAt?: string
  duration?: string
}

export interface PDFResource extends BaseResource {
  type: 'pdf'
  fileUrl: string
  downloadUrl?: string
  pageCount?: number
  fileSize: number
  // ImageKit specific fields
  fileId?: string
  previewUrl?: string
}

export interface AudioResource extends BaseResource {
  type: 'audio'
  fileUrl: string
  downloadUrl?: string
  artist?: string
  album?: string
  genre?: string
  fileSize: number
  // ImageKit specific fields
  fileId?: string
  previewUrl?: string
  waveformUrl?: string
}

export interface VideoResource extends BaseResource {
  type: 'video'
  videoUrl: string
  embedUrl?: string
  resolution?: string
  // YouTube specific fields
  youtubeId?: string
  youtubeUrl?: string
  channelId?: string
  viewCount?: number
  // ImageKit backup fields (if storing video files)
  fileId?: string
  fileSize?: number
}

export type Resource = PDFResource | AudioResource | VideoResource

export interface ResourceFilter {
  type?: 'all' | 'pdf' | 'audio' | 'video'
  category?: 'all' | 'sermons' | 'studies' | 'events' | 'music' | 'other'
  search?: string
  featured?: boolean
  downloadable?: boolean
}

export interface ResourceUpload {
  file: File
  title: string
  description?: string
  category: 'sermons' | 'studies' | 'events' | 'music' | 'other'
  downloadable: boolean
  featured?: boolean
  tags?: string[]
  // Video specific
  youtubeMetadata?: {
    description?: string
    privacyStatus: 'public' | 'unlisted' | 'private'
    tags?: string[]
    thumbnail?: File
  }
}

export interface ResourcePlaylist {
  id: string
  name: string
  description?: string
  resources: Resource[]
  createdAt: string
  updatedAt: string
}

export interface ImageKitResponse {
  fileId: string
  name: string
  url: string
  thumbnailUrl?: string
  filePath: string
  size: number
  fileType: string
  createdAt: string
  updatedAt: string
}

export interface YouTubeUploadResponse {
  videoId: string
  title: string
  description: string
  thumbnails: {
    default: { url: string }
    medium: { url: string }
    high: { url: string }
  }
  channelId: string
  privacyStatus: string
}

export interface ResourceStats {
  totalResources: number
  totalSize: number
  resourcesByType: {
    pdf: number
    audio: number
    video: number
  }
  recentUploads: Resource[]
  popularResources: Resource[]
}
