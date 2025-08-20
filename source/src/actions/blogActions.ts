'use server'

import { createBlogPost, updateBlogPost, deleteBlogPost } from '@/lib/blog'
import { redirect } from 'next/navigation'

// Create new blog post
export async function handleCreateBlogSubmit(formData: FormData) {
    const post = {
        title: (formData.get('title') as string) ?? '',
        content: (formData.get('content') as string) ?? '',
        excerpt: (formData.get('excerpt') as string) ?? '',
        status: (formData.get('status') as 'published' | 'scheduled' | 'draft') ?? 'draft',
        publishDate: formData.get('publishDate')
            ? new Date(formData.get('publishDate') as string)
            : undefined,
        categories: formData.get('categories')
            ? JSON.parse(formData.get('categories') as string)
            : [],
        featuredImage: (formData.get('featuredImage') as string) ?? undefined,
        metaTitle: (formData.get('metaTitle') as string) ?? undefined,
        metaDescription: (formData.get('metaDescription') as string) ?? undefined,
    }

    const result = await createBlogPost(post)

    if (result.data) {
        redirect(`/dashboard/blog/${result.data.slug}`)
    }

    return result
}

// Update existing blog post
export async function handleEditBlogSubmit(postId: string, formData: FormData) {
    const update = {
        title: (formData.get('title') as string) ?? undefined,
        content: (formData.get('content') as string) ?? undefined,
        excerpt: (formData.get('excerpt') as string) ?? undefined,
        status: (formData.get('status') as 'published' | 'scheduled' | 'draft') ?? undefined,
        publishDate: formData.get('publishDate')
            ? new Date(formData.get('publishDate') as string)
            : undefined,
        categories: formData.get('categories')
            ? JSON.parse(formData.get('categories') as string)
            : [],
        featuredImage: (formData.get('featuredImage') as string) ?? undefined,
        metaTitle: (formData.get('metaTitle') as string) ?? undefined,
        metaDescription: (formData.get('metaDescription') as string) ?? undefined,
    }

    const result = await updateBlogPost(postId, update)

    if (result.data) {
        redirect(`/dashboard/blog/${result.data.slug}`)
    }

    return result
}

// Delete blog post
export async function handleDeleteBlog(postId: string) {
    const result = await deleteBlogPost(postId)
    redirect('/dashboard/blog')
    return result
}
