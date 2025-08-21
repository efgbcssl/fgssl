/* eslint-disable @typescript-eslint/no-unused-vars */
// app/(dashboard)/dashboard/blog/[slug]/page.tsx
import BlogEditor from '@/components/blog/BlogEditor'
import { getBlogPostBySlug } from '@/lib/blog'
import { notFound } from 'next/navigation'
import { handleEditBlogSubmit } from '@/actions/blogActions'
import React from 'react'
import { IBlog } from '@/models/Blog'

type Props = { params: { slug: string } }

export default async function EditBlogPost({ params }: Props) {
    const { slug } = params

    // fetch the post
    const postResp = await getBlogPostBySlug(slug)
    const post = (postResp && (postResp.data ?? postResp)) ?? null

    if (!post) {
        notFound()
    }

    // Cast safely to IBlog
    const blogPost = post as unknown as IBlog

    // prepare server action wrapper
    async function handleSubmit(formData: FormData) {
        'use server'
        await handleEditBlogSubmit(blogPost.post_id, formData) // ✅ use post_id, not slug
    }

    // normalize publishDate to ISO string
    const publishDate = blogPost.publishDate
        ? new Date(blogPost.publishDate).toISOString()
        : new Date().toISOString()

    return (
        <div className="container py-8">
            <h1 className="text-2xl font-bold mb-6">Edit Blog Post</h1>

            <BlogEditor
                action={handleSubmit}
                defaultValues={{
                    title: blogPost.title ?? '',
                    content: blogPost.content ?? '',
                    excerpt: blogPost.excerpt ?? '',
                    status: blogPost.status ?? 'draft',
                    publishDate,
                    featuredImage: blogPost.featuredImage ?? '',
                    metaTitle: blogPost.metaTitle ?? '',
                    metaDescription: blogPost.metaDescription ?? '',
                    tags: blogPost.tags ?? [],
                    categories: blogPost.categories ?? [],
                }}
                key={blogPost.post_id} onSubmit={function (formData: FormData): Promise<void> {
                    throw new Error('Function not implemented.')
                } }            />
        </div>
    )
}
