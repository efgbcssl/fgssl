"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, User, Clock, ArrowRight } from "lucide-react";

// Dummy posts data duplicated for pagination demo
const initialPosts = [
    {
        id: 1,
        title: "Finding Peace in a Chaotic World",
        excerpt:
            "In today's fast-paced and often chaotic world, finding inner peace can seem like an impossible task. This post explores spiritual practices that can help center your soul.",
        image: "https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg",
        author: "Pastor John Smith",
        date: "May 12, 2023",
        readTime: "5 min read",
        slug: "finding-peace-chaotic-world",
    },
    {
        id: 2,
        title: "The Power of Community in Modern Times",
        excerpt:
            "As society becomes increasingly digital, the importance of physical community grows. Learn how being part of a church community provides essential human connection.",
        image: "https://images.pexels.com/photos/8107191/pexels-photo-8107191.jpeg",
        author: "Sarah Johnson",
        date: "April 28, 2023",
        readTime: "7 min read",
        slug: "power-community-modern-times",
    },
    {
        id: 3,
        title: "Understanding Biblical Wisdom for Today",
        excerpt:
            "Ancient scripture provides timeless wisdom that remains relevant to our modern challenges. This post explores how to apply biblical principles to contemporary issues.",
        image: "https://images.pexels.com/photos/267559/pexels-photo-267559.jpeg",
        author: "Michael Williams",
        date: "April 15, 2023",
        readTime: "8 min read",
        slug: "understanding-biblical-wisdom-today",
    },
    {
        id: 4,
        title: "Raising Children with Faith in a Secular World",
        excerpt:
            "Raising children with strong faith values can be challenging in today's secular environment. Here are practical strategies for parents navigating this journey.",
        image: "https://images.pexels.com/photos/3979334/pexels-photo-3979334.jpeg",
        author: "Rachel Thompson",
        date: "March 30, 2023",
        readTime: "6 min read",
        slug: "raising-children-faith-secular-world",
    },
    {
        id: 5,
        title: "The Healing Power of Forgiveness",
        excerpt:
            "Forgiveness is not just a spiritual practice but a pathway to emotional healing. Learn how letting go of past hurts can transform your life and relationships.",
        image: "https://images.pexels.com/photos/3094215/pexels-photo-3094215.jpeg",
        author: "Pastor John Smith",
        date: "March 15, 2023",
        readTime: "4 min read",
        slug: "healing-power-forgiveness",
    },
    {
        id: 6,
        title: "Finding Your Purpose: A Christian Perspective",
        excerpt:
            "Many people struggle with questions of purpose and meaning. This post explores how faith can guide you toward discovering your unique calling in life.",
        image: "https://images.pexels.com/photos/3075993/pexels-photo-3075993.jpeg",
        author: "Sarah Johnson",
        date: "February 28, 2023",
        readTime: "9 min read",
        slug: "finding-purpose-christian-perspective",
    },
];

// Post Type
interface Post {
    featuredImage: string;
    post_id: string;
    title: string;
    excerpt: string;
    slug: string;
    status: "draft" | "published";
    publishDate?: string;
    commentCount?: number;
}

interface PostsResponse {
    posts: Post[];
    cursor: string;
    more: boolean;
    size: number;
    pages: number;
}

// API: Fetch posts
async function fetchPosts({ page, size }: { page: number; size: number }) {
    const query = new URLSearchParams();
    query.set("page", String(page));
    query.set("size", String(size));

    const res = await fetch(`/api/blog/posts?${query.toString()}`);
    //   const res = await fetch(`/api/blog/posts`)
    // console.log("response is", await res.json())

    if (!res.ok) throw new Error("Failed to fetch posts");

    const { meta, records, recordsCount } = await res.json();
    // console.log("meta", meta)
    // console.log("records", records)
    const postsResponse: PostsResponse = {
        cursor: meta.page.cursor,
        more: meta.page.more,
        size: meta.page.size,
        posts: records,
        pages: recordsCount,
    };
    return postsResponse;
}
// Duplicate posts for pagination demo (total 18 posts)
const blogPosts = [...initialPosts, ...initialPosts, ...initialPosts].map(
    (post, i) => ({
        ...post,
        id: i + 1,
        slug: `${post.slug}-${i + 1}`,
    })
);

const POSTS_PER_PAGE = 6;

export default function BlogPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [posts, setPosts] = useState<Post[]>([]);
    const [totalPages, setTotalPages] = useState(1);

    // Filter posts by search term on title or author (case insensitive)
    const filteredPosts = useMemo(() => {
        if (!searchTerm) return blogPosts;
        return blogPosts.filter(
            (post) =>
                post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.author.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    const loadPosts = useCallback(async () => {
        const response = await fetchPosts({ page: currentPage, size: POSTS_PER_PAGE });
        setPosts(response.posts);
        setTotalPages(response.pages);

        console.log("response in main blog posts is", response);
    }, [currentPage]);

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    // Featured posts: first 3 posts from filtered
    const featuredPosts = filteredPosts.slice(0, 3);

    // Recent posts: after featured, paginated
    //   const recentPosts = filteredPosts.slice(3);
    //   const totalPages = Math.ceil(recentPosts.length / POSTS_PER_PAGE);
    //   const paginatedPosts = recentPosts.slice(
    //     (currentPage - 1) * POSTS_PER_PAGE,
    //     currentPage * POSTS_PER_PAGE
    //   );

    // Pagination handlers
    const goPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
    const goNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

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

            {/* Search Bar */}
            <section className="py-8">
                <div className="container-custom max-w-xl mx-auto">
                    <input
                        type="search"
                        aria-label="Search blog posts"
                        placeholder="Search by title or author..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-church-primary"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1); // reset page on new search
                        }}
                    />
                </div>
            </section>

            {/* Featured Posts */}
            <section className="py-12">
                <div className="container-custom">
                    <h2 className="section-title mb-8">Featured Posts</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {featuredPosts.map((post) => (
                            <Card key={post.id} className="overflow-hidden card-hover">
                                <div className="relative aspect-[16/9] w-full">
                                    <Image
                                        src={post.image}
                                        alt={post.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 33vw"
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
                                        <Link
                                            href={`/blog/${post.slug}`}
                                            className="hover:text-church-primary transition-colors"
                                        >
                                            {post.title}
                                        </Link>
                                    </CardTitle>
                                    <CardDescription className="text-gray-500">
                                        <span className="flex items-center">
                                            <User className="h-4 w-4 mr-1 text-church-primary" />
                                            <span>{post.author}</span>
                                        </span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pb-3">
                                    <p className="text-gray-600 line-clamp-3">{post.excerpt}</p>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        asChild
                                        variant="ghost"
                                        className="p-0 h-auto text-church-primary hover:text-church-primary/80 hover:bg-transparent"
                                    >
                                        <Link href={`/blog/${post.slug}`}>
                                            Read More <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Recent Posts */}
            <section className="pb-12">
                <div className="container-custom">
                    <h2 className="section-title mb-8">Recent Posts</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <Card key={post.post_id} className="overflow-hidden card-hover">
                                <div className="relative aspect-[16/9] w-full">
                                    <Image
                                        src={post.featuredImage}
                                        alt={post.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-cover"
                                    />
                                </div>
                                <CardHeader className="pb-3">
                                    {/* <div className="flex items-center text-sm text-gray-500 mb-2">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span className="mr-4">{post.date}</span>
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{post.readTime}</span>
                  </div> */}
                                    <CardTitle className="font-heading">
                                        <Link
                                            href={`/blog/${post.slug}`}
                                            className="hover:text-church-primary transition-colors"
                                        >
                                            {post.title}
                                        </Link>
                                    </CardTitle>
                                    {/* <CardDescription className="text-gray-500">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1 text-church-primary" />
                      <span>{post.author}</span>
                    </div>
                  </CardDescription> */}
                                </CardHeader>
                                <CardContent className="pb-3">
                                    <p className="text-gray-600 line-clamp-3">{post.excerpt}</p>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        asChild
                                        variant="ghost"
                                        className="p-0 h-auto text-church-primary hover:text-church-primary/80 hover:bg-transparent"
                                    >
                                        <Link href={`/blog/${post.slug}`}>
                                            Read More <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                        {/* {paginatedPosts.map((post) => (
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
                    <Link
                      href={`/blog/${post.slug}`}
                      className="hover:text-church-primary transition-colors"
                    >
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
                  <Button
                    asChild
                    variant="ghost"
                    className="p-0 h-auto text-church-primary hover:text-church-primary/80 hover:bg-transparent"
                  >
                    <Link href={`/blog/${post.slug}`}>
                      Read More <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))} */}
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-center gap-4 mt-12">
                        <Button
                            variant="outline"
                            disabled={currentPage === 1}
                            onClick={goPrev}
                            className="border-church-primary text-church-primary"
                        >
                            Previous
                        </Button>
                        <span className="self-center text-gray-700 font-medium">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            disabled={currentPage === totalPages}
                            onClick={goNext}
                            className="border-church-primary text-church-primary"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </section>
        </>
    );
}
