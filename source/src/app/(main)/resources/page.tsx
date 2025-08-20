/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Download, FileText, Video, Music, Search,
    Grid, List, Star, SortAsc, SortDesc
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
    Pagination, PaginationContent, PaginationItem,
    PaginationPrevious, PaginationNext
} from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import ResourceCard from '@/components/resources/ResourceCard'
import { AudioResource, ImageResource, LinkResource, PDFResource, Resource, ResourceFilter, VideoResource, isAudioResource, isPDFResource, isVideoResource } from '@/types/resource'

// dynamically import heavy viewers
const VideoPlayer = dynamic(() => import('@/components/resources/VideoPlayer'))
const PDFViewer = dynamic(() => import('@/components/resources/PDFViewer'))
const AudioPlayer = dynamic(() => import('@/components/resources/AudioPlayer'))

const RESOURCE_TYPES = ['all', 'video', 'audio', 'pdf'] as const
const CATEGORIES = ['all', 'sermons', 'studies', 'events', 'music', 'other'] as const
const ITEMS_PER_PAGE = 12

const DEFAULT_THUMBNAILS = {
    video: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTUgMTBsNS4yOTIgNGEuMjY1LjI2NSAwIDAgMSAuMjA4LjQ2M2wtNS4yOTItNGEuMjY1LjI2NSAwIDAgMSAwLS40NjNsNS4yOTItNGEuMjY1LjI2NSAwIDAgMS0uMjA4LjQ2M0wxNSAxMHoiIGZpbGw9IiM2YjcyODAiLz48L3N2Zz4=",
    audio: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNOSAxOHYtNi4zNGE0IDQgMCAxIDEgNCAwVjE4TTkgMThIN200IDBoLTJNOSAxNHY0bTQgMHYtNCIgZmlsbD0iIzM2NzBmYSIgc3Ryb2tlPSIjMzY3MGZhIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=",
    pdf: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTQgMnY0YTIgMiAwIDAgMCAyIDJoNE0xNCAydjRhMiAyIDAgMCAxLTIgMkg4YTQgNCAwIDAgMC00IDR2OGE0IDQgMCAwIDAgNCA0aDhhNCA0IDAgMCAwIDQtNFY4YTQgNCAwIDAgMC00LTRoLTRWN3oiIGZpbGw9IiNlMTFlMWUiLz48cGF0aCBkPSJNOSAxMmg2TTkgMTZoNk05IDIwaDQiIGZpbGw9IiNmZjNhNTAiLz48L3N2Zz4=",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNSAxOWExIDEgMCAwIDEtMS0xVjZhMSAxIDAgMCAxIDEtMWgxNGExIDEgMCAwIDEgMSAxdjEyYTEgMSAwIDAgMS0xIDFINXoiIGZpbGw9IiNmMWY1ZjkiLz48Y2lyY2xlIGN4PSI4LjUiIGN5PSI4LjUiIHI9IjEuNSIgZmlsbD0iIzljYTdmZiIvPjxwYXRoIGQ9Im0yMSAxNS01LTUtNSA1IiBzdHJva2U9IiM2NzcyODAiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==",
    link: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtMTAgMTQgNC00TTguMDMgMTEuOTNjLTEuMDYgMS4wNi0xLjA2IDIuNzggMCAzLjg0LjUzLjUzIDEuMjIuODIgMS45MS44Mi43IDAgMS4zOS0uMjkgMS45Mi0uODJNMTAuOTUgNi41OGMyLjEyLTIuMTIgNS41Ni0yLjEyIDcuNjggMGMyLjEyIDIuMTIgMi4xMiA1LjU2IDAgNy42OC0uNTMuNTMtMS4yMi44Mi0xLjkxLjgyLS43IDAtMS4zOS0uMjktMS45Mi0uODJaIiBmaWxsPSIjOTBhNmZmIi8+PC9zdmc+",
    default: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAgMTBoNGEyIDIgMCAwIDEgMiAydjhhMiAyIDAgMCAxLTIgMkg2YTIgMiAwIDAgMS0yLTJ2LTRhMiAyIDAgMCAxIDItMnoiIGZpbGw9IiNmMWY1ZjkiLz48cGF0aCBkPSJNMTQgMTBoNGEyIDIgMCAwIDEgMiAydjRhMiAyIDAgMCAxLTIgMmgtNGEyIDIgMCAwIDEtMi0ydi00YTIgMiAwIDAgMSAyLTJ6IiBmaWxsPSIjZjFmNWY5Ii8+PHBhdGggZD0iTTYgMTBoNGEyIDIgMCAwIDEgMiAydjRhMiAyIDAgMCAxLTIgMkg2YTIgMiAwIDAgMS0yLTJ2LTRhMiAyIDAgMCAxIDItMnoiIGZpbGw9IiNmMWY1ZjkiLz48L3N2Zz4="
};

export default function EnhancedResourcesPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [filter, setFilter] = useState<ResourceFilter>({
        type: 'all',
        category: 'all',
        search: '',
        downloadable: undefined,
        featured: undefined
    })
    const [currentPage, setCurrentPage] = useState(1)
    const [resources, setResources] = useState<Resource[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [sortBy, setSortBy] = useState<'date' | 'title' | 'type'>('date')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [showFeaturedOnly, setShowFeaturedOnly] = useState(false)
    const [showDownloadableOnly, setShowDownloadableOnly] = useState(false)

    // media state
    const [selectedVideo, setSelectedVideo] = useState<VideoResource | null>(null)
    const [selectedPDF, setSelectedPDF] = useState<PDFResource | null>(null)
    const [selectedAudio, setSelectedAudio] = useState<AudioResource | null>(null)

    useEffect(() => {
        const fetchResources = async () => {
            try {
                setLoading(true)
                const res = await fetch('/api/resources')
                const data = await res.json()

                const transformed: Resource[] = data.map((item: any) => {
                    const thumbnail = item.thumbnail || DEFAULT_THUMBNAILS[item.type as keyof typeof DEFAULT_THUMBNAILS] || DEFAULT_THUMBNAILS.default;
                    const baseResource = {
                        id: item.id,
                        title: item.title,
                        description: item.description || '',
                        thumbnail: thumbnail,
                        thumbnailUrl: thumbnail,
                        date: item.date,
                        createdAt: item.date,
                        type: item.type,
                        downloadable: item.canDownload || false, // API returns 'canDownload'
                        featured: item.featured || false,
                        category: item.category || 'other',
                        tags: item.tags || [],
                    };

                    // Add type-specific properties
                    switch (item.type) {
                        case 'video':
                            return {
                                ...baseResource,
                                videoUrl: item.previewUrl, // API returns 'previewUrl'
                                duration: item.duration,
                                youtubeId: item.id, // Use the video ID as youtubeId
                                embedUrl: item.embedUrl || `https://www.youtube.com/embed/${item.id}`,
                            };
                        case 'audio':
                            return {
                                ...baseResource,
                                audioUrl: item.previewUrl, // API returns 'previewUrl'
                                fileUrl: item.previewUrl, // alias
                                downloadUrl: item.downloadUrl,
                                duration: item.duration,
                            };
                        case 'pdf':
                            return {
                                ...baseResource,
                                fileUrl: item.previewUrl, // API returns 'previewUrl'
                                downloadUrl: item.downloadUrl,
                            };
                        case 'image':
                            return {
                                ...baseResource,
                                imageUrl: item.previewUrl, // API returns 'previewUrl'
                                downloadUrl: item.downloadUrl,
                            };
                        case 'link':
                            return {
                                ...baseResource,
                                url: item.previewUrl, // API returns 'previewUrl'
                            };
                        default:
                            return baseResource;
                    }
                });

                setResources(transformed)
            } catch (e) {
                console.error('Failed to fetch resources', e)
            } finally {
                setLoading(false)
            }
        }
        fetchResources()
    }, [])

    // filtering + sorting
    const filteredAndSortedResources = useMemo(() => {
        const filtered = resources.filter(r => {
            const matchesSearch =
                !searchTerm ||
                r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.description?.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesType = filter.type === 'all' || r.type === filter.type
            const matchesCategory = filter.category === 'all' || r.category === filter.category
            const matchesDownloadable = !showDownloadableOnly || r.downloadable
            const matchesFeatured = !showFeaturedOnly || r.featured

            return matchesSearch && matchesType && matchesCategory && matchesDownloadable && matchesFeatured
        })

        filtered.sort((a, b) => {
            let aVal: any, bVal: any
            switch (sortBy) {
                case 'title':
                    aVal = a.title.toLowerCase()
                    bVal = b.title.toLowerCase()
                    break
                case 'type':
                    aVal = a.type
                    bVal = b.type
                    break
                default:
                    const getDateValue = (resource: Resource): number => {
                        const dateStr = resource.date || resource.createdAt;
                        if (!dateStr) return 0;

                        const date = new Date(dateStr);
                        return isNaN(date.getTime()) ? 0 : date.getTime();
                    }

                    aVal = getDateValue(a);
                    bVal = getDateValue(b);
                    break
            }
            return sortOrder === 'asc'
                ? aVal < bVal ? -1 : aVal > bVal ? 1 : 0
                : aVal > bVal ? -1 : aVal < bVal ? 1 : 0
        })

        return filtered
    }, [resources, searchTerm, filter, showDownloadableOnly, showFeaturedOnly, sortBy, sortOrder])

    const totalPages = Math.ceil(filteredAndSortedResources.length / ITEMS_PER_PAGE)
    const paginatedResources = filteredAndSortedResources.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    // interactions
    const handleResourcePlay = (resource: Resource) => {
        if (isVideoResource(resource)) {
            setSelectedVideo(resource)
        } else if (isAudioResource(resource)) {
            setSelectedAudio(resource as AudioResource)
        } else if (isPDFResource(resource)) {
            setSelectedPDF(resource as PDFResource)
        }
    }

    const handleResourceDownload = (resource: Resource) => {
        if (resource.downloadable) {
            // Get the appropriate download URL based on resource type
            let url: string | undefined;

            switch (resource.type) {
                case 'pdf':
                    url = (resource as PDFResource).downloadUrl || (resource as PDFResource).fileUrl;
                    break;
                case 'video':
                    url = (resource as VideoResource).videoUrl;
                    break;
                case 'audio':
                    url = (resource as AudioResource).downloadUrl || (resource as AudioResource).audioUrl || (resource as AudioResource).fileUrl;
                    break;
                case 'image':
                    url = (resource as ImageResource).downloadUrl || (resource as ImageResource).imageUrl;
                    break;
                case 'link':
                    url = (resource as LinkResource).url;
                    break;
            }

            if (!url) return;

            const link = document.createElement('a');
            link.href = url;
            link.download = resource.title;
            link.target = '_blank'; // Open in new tab for better UX
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    return (
        <>
            {/* Hero */}
            <section className="relative h-[400px] overflow-hidden">
                <Image
                    src="https://images.pexels.com/photos/4048755/pexels-photo-4048755.jpeg"
                    alt="Resources"
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white text-center px-4">
                    <h1 className="text-5xl md:text-6xl font-bold mb-4">Resources</h1>
                    <p className="text-xl md:text-2xl max-w-3xl mb-6">
                        Explore sermons, studies, music & more
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Badge className="bg-red-500"><Video className="h-4 w-4 mr-1" />Videos</Badge>
                        <Badge className="bg-blue-500"><Music className="h-4 w-4 mr-1" />Audio</Badge>
                        <Badge className="bg-green-500"><FileText className="h-4 w-4 mr-1" />Documents</Badge>
                    </div>
                </div>
            </section>

            {/* Main */}
            <section className="py-12">
                <div className="container-custom">
                    {/* search + controls */}
                    <div className="flex flex-col lg:flex-row gap-4 mb-6 justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search resources..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setCurrentPage(1)
                                }}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2 items-center">
                            <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>
                                <Grid className="h-4 w-4" />
                            </Button>
                            <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
                                <List className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-gray-500">{filteredAndSortedResources.length} results</span>
                        </div>
                    </div>

                    {/* filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                        <Select value={filter.type} onValueChange={v => setFilter((f: any) => ({ ...f, type: v as any }))}>
                            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                            <SelectContent>
                                {RESOURCE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={filter.category} onValueChange={v => setFilter((f: any) => ({ ...f, category: v as any }))}>
                            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
                            <SelectTrigger><SelectValue placeholder="Sort by" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="date">Date</SelectItem>
                                <SelectItem value="title">Title</SelectItem>
                                <SelectItem value="type">Type</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={() => setSortOrder(s => s === 'asc' ? 'desc' : 'asc')}>
                            {sortOrder === 'asc' ? <><SortAsc className="h-4 w-4 mr-1" />Asc</> : <><SortDesc className="h-4 w-4 mr-1" />Desc</>}
                        </Button>
                    </div>

                    {/* featured/download toggles */}
                    <div className="flex gap-6 mb-8">
                        <div className="flex items-center space-x-2">
                            <Switch checked={showFeaturedOnly} onCheckedChange={setShowFeaturedOnly} />
                            <Label className="text-sm"><Star className="h-3 w-3 mr-1 inline" />Featured</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch checked={showDownloadableOnly} onCheckedChange={setShowDownloadableOnly} />
                            <Label className="text-sm"><Download className="h-3 w-3 mr-1 inline" />Downloadable</Label>
                        </div>
                    </div>

                    {/* list/grid */}
                    {loading ? (
                        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'}`}>
                            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-[200px] w-full rounded-xl" />)}
                        </div>
                    ) : paginatedResources.length === 0 ? (
                        <div className="text-center py-16 text-gray-500">No resources found</div>
                    ) : (
                        <>
                            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                                {paginatedResources.map(r => (
                                    <ResourceCard
                                        key={r.id}
                                        resource={r}
                                        variant={viewMode}
                                        onPlay={handleResourcePlay}
                                        onDownload={handleResourceDownload}
                                    />
                                ))}
                            </div>
                            {totalPages > 1 && (
                                <Pagination className="mt-12">
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} />
                                        </PaginationItem>
                                        <PaginationItem><span className="px-4">Page {currentPage}/{totalPages}</span></PaginationItem>
                                        <PaginationItem>
                                            <PaginationNext onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* players / viewers */}
            {selectedVideo && (
                <VideoPlayer video={selectedVideo} isOpen={!!selectedVideo} onClose={() => setSelectedVideo(null)} />
            )}
            {selectedPDF && (
                <PDFViewer resource={selectedPDF} isOpen={!!selectedPDF} onClose={() => setSelectedPDF(null)} />
            )}
            {selectedAudio && (
                <AudioPlayer resource={selectedAudio} isOpen={!!selectedAudio} onClose={() => setSelectedAudio(null)} />
            )}
        </>
    )
}

