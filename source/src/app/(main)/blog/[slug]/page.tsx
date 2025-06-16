'use client'

import { useEffect, useState } from 'react'
import { ThumbsUp } from 'lucide-react'
import { CommentSection } from '@/components/blog/CommentSection'

interface Post {
    post_id: string
    title: string
    categories?: string[]
    content: string
    createdAt: string
    likes: number
}

interface BlogPostPageProps {
    params: { slug: string }
    searchParams: { [key: string]: string | undefined }
}

export default function BlogPostPage({ params, searchParams }: BlogPostPageProps) {
    const { slug } = params
    const userId = searchParams.userId ?? ''

    const [post, setPost] = useState<Post | null>(null)
    const [comments, setComments] = useState<any[]>([])
    const [loadingPost, setLoadingPost] = useState(true)
    const [loadingComments, setLoadingComments] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchPost() {
            setLoadingPost(true)
            setError(null)
            try {
                const res = await fetch(`/api/blog/post?slug=${slug}`)
                if (!res.ok) throw new Error('Failed to fetch post')
                const data = await res.json()
                if (!data) {
                    setError('Post not found')
                    setPost(null)
                } else {
                    setPost(data)
                }
            } catch (err: any) {
                setError(err.message || 'Something went wrong')
                setPost(null)
            } finally {
                setLoadingPost(false)
            }
        }

        fetchPost()
    }, [slug])

    useEffect(() => {
        if (!post) return

        async function fetchComments() {
            setLoadingComments(true)
            try {
                const res = await fetch(`/api/blog/comments?postId=${post.post_id}`, {
                    cache: 'no-store',
                })
                if (!res.ok) throw new Error('Failed to fetch comments')
                const data = await res.json()
                setComments(data)
            } catch {
                setComments([])
            } finally {
                setLoadingComments(false)
            }
        }

        fetchComments()
    }, [post])

    if (loadingPost) {
        return <p className="text-center py-10">Loading post...</p>
    }

    if (error) {
        return <p className="text-center py-10 text-red-600">{error}</p>
    }

    if (!post) {
        return <p className="text-center py-10">Post not found.</p>
    }

    return (
        <div className="max-w-3xl mx-auto py-8">
            <article className="prose lg:prose-xl">
                <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

                <div className="mb-4">
                    {post.categories?.map((category) => (
                        <span
                            key={category}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-2"
                        >
                            {category}
                        </span>
                    ))}
                </div>

                <div dangerouslySetInnerHTML={{ __html: post.content }} />

                <div className="flex items-center gap-4 mt-8 text-sm text-gray-500">
                    <span>
                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </span>
                    <span>•</span>
                    <button className="flex items-center gap-1 hover:text-blue-500" aria-label="Likes">
                        <ThumbsUp className="h-4 w-4" /> {post.likes} Like{post.likes !== 1 ? 's' : ''}
                    </button>
                </div>
            </article>

            <CommentSection
                postSlug={slug}
                postId={post.post_id}
                userId={userId}
                initialComments={comments}
                loading={loadingComments}
            />
        </div>
    )
}
