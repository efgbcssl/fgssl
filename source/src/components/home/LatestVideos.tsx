import Image from 'next/image'
import Link from 'next/link'
import { Play, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import slide1 from '@/assets/images/slide1.jpg'
import slide2 from '@/assets/images/slide2.jpg'


const videos = [
  {
    id: 1,
    title: "Sunday Sermon: Finding Peace in Troubled Times",
    thumbnailUrl: slide1,
    duration: "28:45",
    pastor: "Pastor John Smith",
    date: "April 23, 2023",
    videoUrl: "#",
  },
  {
    id: 2,
    title: "Worship Concert: Night of Praise",
    thumbnailUrl: slide2,
    duration: "1:15:32",
    pastor: "Worship Team",
    date: "April 16, 2023",
    videoUrl: "#",
  },
]

export default function LatestVideos() {
  return (
    <section className="py-16">
      <div className="container-custom">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10">
          <h2 className="section-title mb-4 sm:mb-0">Latest Videos</h2>
          <Button asChild variant="outline" className="border-church-primary text-church-primary">
            <Link href="/resources">View All Videos</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {videos.map((video) => (
            <div
              key={video.id}
              className="group relative overflow-hidden rounded-xl shadow-md card-hover"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video w-full overflow-hidden">
                <Image
                  src={video.thumbnailUrl}
                  alt={video.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-church-primary/90 flex items-center justify-center 
                       transform transition-transform duration-300 group-hover:scale-110">
                    <Play fill="white" className="h-6 w-6 text-white ml-1" />
                  </div>
                </div>

                {/* Duration badge */}
                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2 py-1 rounded-md text-sm flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {video.duration}
                </div>
              </div>

              {/* Video info */}
              <div className="p-4 bg-white">
                <h3 className="font-heading text-lg font-semibold mb-2 text-gray-900">
                  {video.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {video.pastor} • {video.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}