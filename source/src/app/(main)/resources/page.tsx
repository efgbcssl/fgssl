'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
    Download,
    FileText,
    Video,
    Music,
    Clock,
    Calendar,
    Play,
    ExternalLink,
    Search,
    Filter,
    Grid,
    List,
    Star,
    SortAsc,
    SortDesc,
    Eye
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationPrevious,
    PaginationNext
} from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import ResourceCard from '@/components/resources/ResourceCard'
import VideoPlayer from '@/components/resources/VideoPlayer'
import type { Resource, ResourceFilter, VideoResource } from '@/types/resources'

const RESOURCE_TYPES = ['all', 'video', 'audio', 'pdf'] as const
const CATEGORIES = ['all', 'sermons', 'studies', 'events', 'music', 'other'] as const
const ITEMS_PER_PAGE = 12

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
    const [selectedVideo, setSelectedVideo] = useState<VideoResource | null>(null)
    const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false)

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const res = await fetch('/api/resources')
                const data = await res.json()
                
                // Transform the data to match our Resource interface
                const transformedResources: Resource[] = data.map((item: any) => ({
                    id: item.id,
                    title: item.title,
                    description: item.description || '',
                    thumbnail: item.thumbnail,
                    date: item.date,
                    type: item.type,
                    downloadable: item.canDownload || item.downloadable || false,
                    featured: Math.random() > 0.8, // Randomly mark some as featured for demo
                    category: 'sermons', // Default category
                    tags: item.tags || [],
                    duration: item.duration,
                    // Type-specific fields
                    ...(item.type === 'video' ? {
                        videoUrl: item.previewUrl,
                        youtubeId: item.youtubeId,
                        youtubeUrl: item.previewUrl,
                        embedUrl: item.previewUrl
                    } : {}),
                    ...(item.type === 'audio' || item.type === 'pdf' ? {
                        fileUrl: item.previewUrl,
                        downloadUrl: item.downloadUrl,
                        fileSize: item.size || 0
                    } : {})
                }))
                
                setResources(transformedResources)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchResources()
    }, [])

    const filteredAndSortedResources = useMemo(() => {
        let filtered = resources.filter((resource) => {
            const matchesSearch = !searchTerm || 
                resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                resource.description?.toLowerCase().includes(searchTerm.toLowerCase())
            
            const matchesType = filter.type === 'all' || resource.type === filter.type
            const matchesCategory = filter.category === 'all' || resource.category === filter.category
            const matchesDownloadable = !showDownloadableOnly || resource.downloadable
            const matchesFeatured = !showFeaturedOnly || resource.featured
            
            return matchesSearch && matchesType && matchesCategory && matchesDownloadable && matchesFeatured
        })

        // Sort resources
        filtered.sort((a, b) => {
            let aValue: string | number, bValue: string | number
            
            switch (sortBy) {
                case 'title':
                    aValue = a.title.toLowerCase()
                    bValue = b.title.toLowerCase()
                    break
                case 'type':
                    aValue = a.type
                    bValue = b.type
                    break
                case 'date':
                default:
                    aValue = new Date(a.date).getTime()
                    bValue = new Date(b.date).getTime()
                    break
            }
            
            if (sortOrder === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
            }
        })

        return filtered
    }, [resources, searchTerm, filter, showDownloadableOnly, showFeaturedOnly, sortBy, sortOrder])

    const totalPages = Math.ceil(filteredAndSortedResources.length / ITEMS_PER_PAGE)
    const paginatedResources = filteredAndSortedResources.slice(
        (currentPage - 1) * ITEMS_PER_PAGE, 
        currentPage * ITEMS_PER_PAGE
    )

    const handleResourcePlay = (resource: Resource) => {
        if (resource.type === 'video') {
            setSelectedVideo(resource as VideoResource)
            setIsVideoPlayerOpen(true)
        } else if (resource.type === 'pdf') {
            window.open(resource.fileUrl, '_blank')
        }
    }

    const handleResourceDownload = (resource: Resource) => {
        if (resource.downloadable) {
            const downloadUrl = resource.type === 'video' 
                ? resource.videoUrl 
                : resource.downloadUrl || resource.fileUrl
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = resource.title
            link.click()
        }
    }

    const updateFilter = (key: keyof ResourceFilter, value: any) => {
        setFilter(prev => ({ ...prev, [key]: value }))
        setCurrentPage(1)
    }

    return (
        <>
            {/* Hero Section */}
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
                        Discover our comprehensive library of spiritual content
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 text-sm">
                        <Badge className="bg-red-500 text-white px-3 py-1">
                            <Video className="h-4 w-4 mr-1" />
                            Videos
                        </Badge>
                        <Badge className="bg-blue-500 text-white px-3 py-1">
                            <Music className="h-4 w-4 mr-1" />
                            Audio
                        </Badge>
                        <Badge className="bg-green-500 text-white px-3 py-1">
                            <FileText className="h-4 w-4 mr-1" />
                            Documents
                        </Badge>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-12">
                <div className="container-custom">
                    {/* Filters and Controls */}
                    <div className="mb-8 space-y-6">
                        {/* Search and View Controls */}
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
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
                            
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setViewMode('grid')}
                                    >
                                        <Grid className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant={viewMode === 'list' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setViewMode('list')}
                                    >
                                        <List className="h-4 w-4" />
                                    </Button>
                                </div>
                                
                                <div className="text-sm text-gray-600">
                                    {filteredAndSortedResources.length} resources
                                </div>
                            </div>
                        </div>

                        {/* Advanced Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                            <Select
                                value={filter.type}
                                onValueChange={(value) => updateFilter('type', value as any)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {RESOURCE_TYPES.map(type => (
                                        <SelectItem key={type} value={type}>
                                            {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={filter.category}
                                onValueChange={(value) => updateFilter('category', value as any)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map(category => (
                                        <SelectItem key={category} value={category}>
                                            {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={sortBy}
                                onValueChange={(value) => setSortBy(value as any)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="date">Date</SelectItem>
                                    <SelectItem value="title">Title</SelectItem>
                                    <SelectItem value="type">Type</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="justify-start"
                            >
                                {sortOrder === 'asc' ? (
                                    <>
                                        <SortAsc className="h-4 w-4 mr-2" />
                                        Ascending
                                    </>
                                ) : (
                                    <>
                                        <SortDesc className="h-4 w-4 mr-2" />
                                        Descending
                                    </>
                                )}
                            </Button>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="featured"
                                    checked={showFeaturedOnly}
                                    onCheckedChange={setShowFeaturedOnly}
                                />
                                <Label htmlFor="featured" className="text-sm">
                                    <Star className="h-3 w-3 inline mr-1" />
                                    Featured
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="downloadable"
                                    checked={showDownloadableOnly}
                                    onCheckedChange={setShowDownloadableOnly}
                                />
                                <Label htmlFor="downloadable" className="text-sm">
                                    <Download className="h-3 w-3 inline mr-1" />
                                    Downloadable
                                </Label>
                            </div>
                        </div>
                    </div>

                    {/* Resources Grid/List */}
                    {loading ? (
                        <div className={`grid gap-6 ${
                            viewMode === 'grid' 
                                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                                : 'grid-cols-1'
                        }`}>
                            {[...Array(8)].map((_, i) => (
                                <Skeleton key={i} className={`${
                                    viewMode === 'grid' ? 'h-[400px]' : 'h-[150px]'
                                } w-full rounded-xl`} />
                            ))}
                        </div>
                    ) : paginatedResources.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-gray-400 text-6xl mb-4">
                                <Search className="h-16 w-16 mx-auto" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                No resources found
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Try adjusting your search criteria or filters
                            </p>
                            <Button 
                                onClick={() => {
                                    setSearchTerm('')
                                    setFilter({
                                        type: 'all',
                                        category: 'all',
                                        search: '',
                                        downloadable: undefined,
                                        featured: undefined
                                    })
                                    setShowFeaturedOnly(false)
                                    setShowDownloadableOnly(false)
                                }}
                            >
                                Clear All Filters
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className={`grid gap-6 ${
                                viewMode === 'grid' 
                                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                                    : 'grid-cols-1'
                            }`}>
                                {paginatedResources.map(resource => (
                                    <ResourceCard
                                        key={resource.id}
                                        resource={resource}
                                        variant={viewMode}
                                        showCategory={true}
                                        onPlay={handleResourcePlay}
                                        onDownload={handleResourceDownload}
                                    />
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-12">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                    className={`cursor-pointer ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                />
                                            </PaginationItem>
                                            <PaginationItem>
                                                <span className="px-4 py-2 text-sm">
                                                    Page {currentPage} of {totalPages} 
                                                    ({filteredAndSortedResources.length} total resources)
                                                </span>
                                            </PaginationItem>
                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                                    className={`cursor-pointer ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* Video Player Modal */}
            {selectedVideo && (
                <VideoPlayer
                    video={selectedVideo}
                    isOpen={isVideoPlayerOpen}
                    onClose={() => {
                        setIsVideoPlayerOpen(false)
                        setSelectedVideo(null)
                    }}
                />
            )}
        </>
    )
}
