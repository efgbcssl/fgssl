import Image from 'next/image'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Download, File, FileText, Video, DownloadCloud, Headphones, Clock, Calendar, Play, ExternalLink } from 'lucide-react'

// Sample resources data
const resources = {
    sermons: [
        {
            id: 1,
            title: "Finding Peace in Troubled Times",
            type: "video",
            thumbnail: "https://images.pexels.com/photos/2774546/pexels-photo-2774546.jpeg",
            speaker: "Pastor John Smith",
            date: "April 23, 2023",
            duration: "35:42",
            downloadUrl: "#",
            previewUrl: "#",
        },
        {
            id: 2,
            title: "The Power of Prayer",
            type: "audio",
            thumbnail: "https://images.pexels.com/photos/7108244/pexels-photo-7108244.jpeg",
            speaker: "Pastor John Smith",
            date: "April 16, 2023",
            duration: "28:15",
            downloadUrl: "#",
            previewUrl: "#",
        },
        {
            id: 3,
            title: "Faith Over Fear",
            type: "video",
            thumbnail: "https://images.pexels.com/photos/935944/pexels-photo-935944.jpeg",
            speaker: "Guest Speaker Dr. Emily Johnson",
            date: "April 9, 2023",
            duration: "42:18",
            downloadUrl: "#",
            previewUrl: "#",
        },
    ],
    studies: [
        {
            id: 1,
            title: "Bible Study: The Book of Romans",
            type: "pdf",
            thumbnail: "https://images.pexels.com/photos/267559/pexels-photo-267559.jpeg",
            author: "Pastor John Smith",
            date: "March 2023",
            pages: 36,
            downloadUrl: "#",
            previewUrl: "#",
        },
        {
            id: 2,
            title: "40 Days of Prayer Devotional",
            type: "pdf",
            thumbnail: "https://images.pexels.com/photos/4100661/pexels-photo-4100661.jpeg",
            author: "Church Staff",
            date: "January 2023",
            pages: 42,
            downloadUrl: "#",
            previewUrl: "#",
        },
        {
            id: 3,
            title: "Family Devotional Guide",
            type: "pdf",
            thumbnail: "https://images.pexels.com/photos/4667138/pexels-photo-4667138.jpeg",
            author: "Sarah Johnson",
            date: "February 2023",
            pages: 28,
            downloadUrl: "#",
            previewUrl: "#",
        },
    ],
    events: [
        {
            id: 1,
            title: "Easter Service Program",
            type: "pdf",
            thumbnail: "https://images.pexels.com/photos/6157253/pexels-photo-6157253.jpeg",
            date: "April 9, 2023",
            pages: 12,
            downloadUrl: "#",
            previewUrl: "#",
        },
        {
            id: 2,
            title: "Summer Camp Registration Packet",
            type: "pdf",
            thumbnail: "https://images.pexels.com/photos/1058958/pexels-photo-1058958.jpeg",
            date: "Summer 2023",
            pages: 18,
            downloadUrl: "#",
            previewUrl: "#",
        },
        {
            id: 3,
            title: "Annual Church Picnic Flyer",
            type: "pdf",
            thumbnail: "https://images.pexels.com/photos/1660995/pexels-photo-1660995.jpeg",
            date: "July 15, 2023",
            pages: 2,
            downloadUrl: "#",
            previewUrl: "#",
        },
    ],
};

// Helper for determining file type icon
const getFileIcon = (type: string) => {
    switch (type) {
        case 'pdf':
            return <FileText className="h-6 w-6" />;
        case 'video':
            return <Video className="h-6 w-6" />;
        case 'audio':
            return <Headphones className="h-6 w-6" />;
        default:
            return <File className="h-6 w-6" />;
    }
};

export default function ResourcesPage() {
    return (
        <>
            {/* Hero Section */}
            <section className="relative h-[300px] md:h-[350px] overflow-hidden">
                <Image
                    src="https://images.pexels.com/photos/4048755/pexels-photo-4048755.jpeg"
                    alt="Resources"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="container-custom relative z-10 h-full flex flex-col justify-center items-center text-center text-white">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-heading">
                        Resources
                    </h1>
                    <p className="text-lg max-w-2xl">
                        Access sermons, Bible studies, and materials to help you grow in your faith
                    </p>
                </div>
            </section>

            {/* Resources Tabs */}
            <section className="py-16">
                <div className="container-custom">
                    <Tabs defaultValue="sermons" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
                            <TabsTrigger value="sermons">Sermons</TabsTrigger>
                            <TabsTrigger value="studies">Bible Studies</TabsTrigger>
                            <TabsTrigger value="events">Events</TabsTrigger>
                        </TabsList>

                        {/* Sermons Tab Content */}
                        <TabsContent value="sermons" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {resources.sermons.map((resource) => (
                                    <Card key={resource.id} className="card-hover overflow-hidden">
                                        <div className="relative aspect-video w-full group overflow-hidden">
                                            <Image
                                                src={resource.thumbnail}
                                                alt={resource.title}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                className="object-cover transition duration-300 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />

                                            {/* Play button for video/audio */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Button
                                                    size="icon"
                                                    className="h-14 w-14 rounded-full bg-church-primary/90 hover:bg-church-primary transition-transform duration-300 group-hover:scale-110"
                                                    asChild
                                                >
                                                    <a href={resource.previewUrl} target="_blank">
                                                        <Play fill="white" className="h-6 w-6 text-white ml-1" />
                                                    </a>
                                                </Button>
                                            </div>

                                            {/* Resource type badge */}
                                            <Badge
                                                className={`absolute top-4 right-4 ${resource.type === 'video'
                                                        ? 'bg-red-500'
                                                        : resource.type === 'audio'
                                                            ? 'bg-blue-500'
                                                            : 'bg-green-500'
                                                    }`}
                                            >
                                                {resource.type.toUpperCase()}
                                            </Badge>
                                        </div>

                                        <CardContent className="p-4">
                                            <h3 className="font-bold text-lg mb-2 font-heading">{resource.title}</h3>
                                            <div className="text-sm text-gray-500 space-y-1">
                                                <div className="flex items-center">
                                                    <Calendar className="h-4 w-4 mr-1" />
                                                    {resource.date}
                                                </div>
                                                <div className="flex items-center">
                                                    <Clock className="h-4 w-4 mr-1" />
                                                    {resource.duration}
                                                </div>
                                            </div>
                                        </CardContent>

                                        <CardFooter className="px-4 py-3 border-t flex justify-between">
                                            <Button size="sm" variant="outline" asChild>
                                                <a href={resource.previewUrl}>
                                                    <Play className="h-4 w-4 mr-1" /> Play
                                                </a>
                                            </Button>
                                            <Button size="sm" className="bg-church-primary text-white hover:bg-church-primary/90" asChild>
                                                <a href={resource.downloadUrl} download>
                                                    <Download className="h-4 w-4 mr-1" /> Download
                                                </a>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Bible Studies Tab Content */}
                        <TabsContent value="studies" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {resources.studies.map((resource) => (
                                    <Card key={resource.id} className="card-hover overflow-hidden">
                                        <div className="relative aspect-[4/3] w-full group overflow-hidden">
                                            <Image
                                                src={resource.thumbnail}
                                                alt={resource.title}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                className="object-cover transition duration-300 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

                                            {/* Preview button */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Button
                                                    className="bg-church-primary/90 hover:bg-church-primary text-white transition-colors"
                                                    asChild
                                                >
                                                    <a href={resource.previewUrl} target="_blank">
                                                        <ExternalLink className="h-4 w-4 mr-2" /> Preview
                                                    </a>
                                                </Button>
                                            </div>

                                            {/* Resource type badge */}
                                            <Badge
                                                className="absolute top-4 right-4 bg-green-500"
                                            >
                                                PDF
                                            </Badge>
                                        </div>

                                        <CardContent className="p-4">
                                            <h3 className="font-bold text-lg mb-2 font-heading">{resource.title}</h3>
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <p>{resource.author}</p>
                                                <div className="flex items-center justify-between">
                                                    <span>{resource.date}</span>
                                                    <span>{resource.pages} pages</span>
                                                </div>
                                            </div>
                                        </CardContent>

                                        <CardFooter className="px-4 py-3 border-t">
                                            <Button className="w-full bg-church-primary text-white hover:bg-church-primary/90" asChild>
                                                <a href={resource.downloadUrl} download>
                                                    <DownloadCloud className="h-4 w-4 mr-1" /> Download PDF
                                                </a>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Events Tab Content */}
                        <TabsContent value="events" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {resources.events.map((resource) => (
                                    <Card key={resource.id} className="card-hover overflow-hidden">
                                        <div className="relative aspect-video w-full group overflow-hidden">
                                            <Image
                                                src={resource.thumbnail}
                                                alt={resource.title}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                className="object-cover transition duration-300 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

                                            {/* Preview button */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Button
                                                    className="bg-church-primary/90 hover:bg-church-primary text-white transition-colors"
                                                    asChild
                                                >
                                                    <a href={resource.previewUrl} target="_blank">
                                                        <ExternalLink className="h-4 w-4 mr-2" /> Preview
                                                    </a>
                                                </Button>
                                            </div>

                                            {/* Resource type badge */}
                                            <Badge
                                                className="absolute top-4 right-4 bg-green-500"
                                            >
                                                PDF
                                            </Badge>
                                        </div>

                                        <CardContent className="p-4">
                                            <h3 className="font-bold text-lg mb-2 font-heading">{resource.title}</h3>
                                            <div className="text-sm text-gray-600 flex justify-between">
                                                <span>{resource.date}</span>
                                                <span>{resource.pages} pages</span>
                                            </div>
                                        </CardContent>

                                        <CardFooter className="px-4 py-3 border-t">
                                            <Button className="w-full bg-church-primary text-white hover:bg-church-primary/90" asChild>
                                                <a href={resource.downloadUrl} download>
                                                    <DownloadCloud className="h-4 w-4 mr-1" /> Download
                                                </a>
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </section>

            {/* Additional Resources CTA */}
            <section className="bg-church-primary text-white py-12">
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div>
                            <h2 className="text-3xl font-bold mb-4 font-heading">Need Special Resources?</h2>
                            <p className="mb-6">
                                We have additional resources available for small groups, family devotions,
                                and specialized needs. Contact our office for assistance.
                            </p>
                            <Button className="bg-white text-church-primary hover:bg-white/90">
                                Request Resources
                            </Button>
                        </div>

                        <div>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { title: "Small Group Materials", icon: "👨‍👩‍👧‍👦" },
                                    { title: "Marriage Resources", icon: "💍" },
                                    { title: "Children's Activities", icon: "👶" },
                                    { title: "Prayer Guides", icon: "🙏" },
                                ].map((item, index) => (
                                    <div key={index} className="bg-white/10 p-4 rounded-lg text-center">
                                        <div className="text-3xl mb-2">{item.icon}</div>
                                        <h3 className="font-medium">{item.title}</h3>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}