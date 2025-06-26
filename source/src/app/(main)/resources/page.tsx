// EnhancedResourcesPage.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import {
    Card,
    CardContent,
    CardFooter
} from '@/components/ui/card'
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
    Headphones,
    Clock,
    Calendar,
    Play,
    ExternalLink
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

const RESOURCE_TYPES = ['all', 'video', 'audio', 'pdf']
const TABS = ['sermons', 'studies', 'events']
const ITEMS_PER_PAGE = 6

export default function EnhancedResourcesPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState('sermons')
    const [resourceType, setResourceType] = useState('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [resources, setResources] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const res = await fetch('/api/resources')
                const data = await res.json()
                setResources(data)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchResources()
    }, [])

    const filteredResources = useMemo(() => {
        return resources
            .filter((r) =>
                r.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
                (resourceType === 'all' || r.type === resourceType)
            )
    }, [resources, searchTerm, resourceType])

    const totalPages = Math.ceil(filteredResources.length / ITEMS_PER_PAGE)
    const paginated = filteredResources.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

    const renderCard = (res: any) => {
        return (
            <Card key={res.id} className="overflow-hidden">
                <div className="relative aspect-video w-full group">
                    {res.thumbnail ? (
                        <Image
                            src={res.thumbnail}
                            alt={res.title}
                            fill
                            sizes="100vw"
                            className="object-cover"
                        />
                    ) : (
                        <div className="bg-gray-200 w-full h-full flex items-center justify-center text-gray-500 text-sm">No Image</div>
                    )}
                    <div className="absolute top-4 right-4">
                        <Badge className={
                            res.type === 'video' ? 'bg-red-500' :
                                res.type === 'audio' ? 'bg-blue-500' :
                                    'bg-green-500'
                        }>{res.type.toUpperCase()}</Badge>
                    </div>
                </div>

                <CardContent className="p-4">
                    <h3 className="text-lg font-bold truncate mb-1">{res.title}</h3>
                    <p className="text-sm text-gray-500 mb-1 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" /> {new Date(res.date).toLocaleDateString()}
                    </p>
                    {res.duration && (
                        <p className="text-sm text-gray-500 flex items-center">
                            <Clock className="h-4 w-4 mr-1" /> {res.duration}
                        </p>
                    )}
                </CardContent>

                <CardFooter className="px-4 py-3 border-t flex flex-col gap-2">
                    {res.type === 'audio' ? (
                        <audio controls className="w-full">
                            <source src={res.previewUrl} type="audio/mpeg" />
                            Your browser does not support the audio tag.
                        </audio>
                    ) : res.type === 'pdf' ? (
                        <iframe src={res.previewUrl} className="w-full h-64 border rounded-md" />
                    ) : (
                        <Button variant="outline" asChild>
                            <a href={res.previewUrl} target="_blank">
                                <Play className="h-4 w-4 mr-1" /> Watch
                            </a>
                        </Button>
                    )}

                    {res.canDownload && (
                        <Button className="w-full bg-church-primary text-white hover:bg-church-primary/90" asChild>
                            <a href={res.downloadUrl} download>
                                <Download className="h-4 w-4 mr-1" /> Download
                            </a>
                        </Button>
                    )}
                </CardFooter>
            </Card>
        )
    }

    return (
        <>
            <section className="relative h-[300px] md:h-[350px] overflow-hidden">
                <Image
                    src="https://images.pexels.com/photos/4048755/pexels-photo-4048755.jpeg"
                    alt="Resources"
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white text-center">
                    <h1 className="text-4xl font-bold">Resources</h1>
                    <p className="text-lg max-w-xl">Watch, listen or read. Curated spiritual content to help you grow.</p>
                </div>
            </section>

            <section className="py-16">
                <div className="container-custom">
                    <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
                        <Input
                            placeholder="Search resources..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="max-w-md"
                        />
                        <div className="flex flex-wrap gap-2">
                            {RESOURCE_TYPES.map(type => (
                                <Button
                                    key={type}
                                    size="sm"
                                    variant={resourceType === type ? 'default' : 'outline'}
                                    onClick={() => {
                                        setResourceType(type)
                                        setCurrentPage(1)
                                    }}
                                >
                                    {type.toUpperCase()}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className="h-[250px] w-full rounded-xl" />
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {paginated.map(renderCard)}
                            </div>
                            {totalPages > 1 && (
                                <div className="mt-8">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                    className="cursor-pointer"
                                                />
                                            </PaginationItem>
                                            <PaginationItem>
                                                Page {currentPage} of {totalPages}
                                            </PaginationItem>
                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                                    className="cursor-pointer"
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
        </>
    )
}
