import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, User, Clock, ArrowRight } from 'lucide-react'

// Sample blog posts data (would come from CMS/database in real app)
const blogPosts = [
    {
        id: 1,
        title: "Finding Peace in a Chaotic World",
        excerpt: "In today's fast-paced and often chaotic world, finding inner peace can seem like an impossible task. This post explores spiritual practices that can help center your soul.",
        image: "https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg",
        author: "Pastor John Smith",
        date: "May 12, 2023",
        readTime: "5 min read",
        slug: "finding-peace-chaotic-world"
    },
    {
        id: 2,
        title: "The Power of Community in Modern Times",
        excerpt: "As society becomes increasingly digital, the importance of physical community grows. Learn how being part of a church community provides essential human connection.",
        image: "https://images.pexels.com/photos/8107191/pexels-photo-8107191.jpeg",
        author: "Sarah Johnson",
        date: "April 28, 2023",
        readTime: "7 min read",
        slug: "power-community-modern-times"
    },
    {
        id: 3,
        title: "Understanding Biblical Wisdom for Today",
        excerpt: "Ancient scripture provides timeless wisdom that remains relevant to our modern challenges. This post explores how to apply biblical principles to contemporary issues.",
        image: "https://images.pexels.com/photos/267559/pexels-photo-267559.jpeg",
        author: "Michael Williams",
        date: "April 15, 2023",
        readTime: "8 min read",
        slug: "understanding-biblical-wisdom-today"
    },
    {
        id: 4,
        title: "Raising Children with Faith in a Secular World",
        excerpt: "Raising children with strong faith values can be challenging in today's secular environment. Here are practical strategies for parents navigating this journey.",
        image: "https://images.pexels.com/photos/3979334/pexels-photo-3979334.jpeg",
        author: "Rachel Thompson",
        date: "March 30, 2023",
        readTime: "6 min read",
        slug: "raising-children-faith-secular-world"
    },
    {
        id: 5,
        title: "The Healing Power of Forgiveness",
        excerpt: "Forgiveness is not just a spiritual practice but a pathway to emotional healing. Learn how letting go of past hurts can transform your life and relationships.",
        image: "https://images.pexels.com/photos/3094215/pexels-photo-3094215.jpeg",
        author: "Pastor John Smith",
        date: "March 15, 2023",
        readTime: "4 min read",
        slug: "healing-power-forgiveness"
    },
    {
        id: 6,
        title: "Finding Your Purpose: A Christian Perspective",
        excerpt: "Many people struggle with questions of purpose and meaning. This post explores how faith can guide you toward discovering your unique calling in life.",
        image: "https://images.pexels.com/photos/3075993/pexels-photo-3075993.jpeg",
        author: "Sarah Johnson",
        date: "February 28, 2023",
        readTime: "9 min read",
        slug: "finding-purpose-christian-perspective"
    }
]

export default function BlogPage() {
    return (
        <>
            {/* Hero Section */}
            <section className="relative h-[300px] md:h-[350px] overflow-hidden">
                <Image
                    src="https://images.pexels.com/photos/3694706/pexels-photo-3694706.jpeg"
                    alt="Blog"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="container-custom relative z-10 h-full flex flex-col justify-center items-center text-center text-white">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-heading">
                        Church Blog
                    </h1>
                    <p className="text-lg max-w-2xl">
                        Spiritual insights, church updates, and community stories
                    </p>
                </div>
            </section>

            {/* Blog Posts */}
            <section className="py-16">
                <div className="container-custom">
                    {/* Featured Post */}
                    <div className="mb-12">
                        <h2 className="section-title">Featured Post</h2>
                        <Card className="overflow-hidden card-hover">
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                <div className="relative h-64 md:h-full">
                                    <Image
                                        src={blogPosts[0].image}
                                        alt={blogPosts[0].title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        className="object-cover"
                                    />
                                </div>
                                <div className="p-6 md:p-8 flex flex-col justify-between">
                                    <div>
                                        <div className="mb-4 flex items-center text-sm text-gray-500">
                                            <Calendar className="h-4 w-4 mr-1" />
                                            <span className="mr-4">{blogPosts[0].date}</span>
                                            <Clock className="h-4 w-4 mr-1" />
                                            <span>{blogPosts[0].readTime}</span>
                                        </div>
                                        <h3 className="text-2xl font-bold font-heading mb-3">
                                            <Link href={`/blog/${blogPosts[0].slug}`} className="hover:text-church-primary transition-colors">
                                                {blogPosts[0].title}
                                            </Link>
                                        </h3>
                                        <p className="text-gray-600 mb-4">{blogPosts[0].excerpt}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                                            <User className="h-4 w-4 mr-1 text-church-primary" />
                                            <span className="text-sm">{blogPosts[0].author}</span>
                                        </div>
                                        <Button asChild className="bg-church-primary text-white hover:bg-church-primary/90">
                                            <Link href={`/blog/${blogPosts[0].slug}`}>
                                                Read More <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Recent Posts Grid */}
                    <div className="mb-12">
                        <h2 className="section-title">Recent Posts</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {blogPosts.slice(1).map((post) => (
                                <Card key={post.id} className="overflow-hidden card-hover">
                                    <div className="relative aspect-[16/9] w-full">
                                        <Image
                                            src={post.image}
                                            alt={post.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            className="object-cover"
                                        />
                                    </div>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center text-sm text-gray-500 mb-2">
                                            <Calendar className="h-4 w-4 mr-1" />
                                            <span className="mr-4">{post.date}</span>
                                            <Clock className="h-4 w-4 mr-1" />
                                            <span>{post.readTime}</span>
                                        </div>
                                        <CardTitle className="font-heading">
                                            <Link href={`/blog/${post.slug}`} className="hover:text-church-primary transition-colors">
                                                {post.title}
                                            </Link>
                                        </CardTitle>
                                        <CardDescription className="text-gray-500">
                                            <div className="flex items-center">
                                                <User className="h-4 w-4 mr-1 text-church-primary" />
                                                <span>{post.author}</span>
                                            </div>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pb-3">
                                        <p className="text-gray-600 line-clamp-3">{post.excerpt}</p>
                                    </CardContent>
                                    <CardFooter>
                                        <Button asChild variant="ghost" className="p-0 h-auto text-church-primary hover:text-church-primary/80 hover:bg-transparent">
                                            <Link href={`/blog/${post.slug}`}>
                                                Read More <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Load More */}
                    <div className="text-center">
                        <Button variant="outline" className="border-church-primary text-church-primary">
                            Load More Posts
                        </Button>
                    </div>
                </div>
            </section>
        </>
    )
}