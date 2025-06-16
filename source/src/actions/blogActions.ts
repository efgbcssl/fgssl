// src/actions/blogActions.ts
'use server'

import { updateBlogPost } from '@/lib/blog'
import { redirect } from 'next/navigation'

export async function handleEditBlogSubmit(slug: string, formData: FormData) {
    const update = {
        title: (formData.get('title') as string) ?? undefined,
        content: (formData.get('content') as string) ?? undefined,
        excerpt: (formData.get('excerpt') as string) ?? undefined,
        status: (formData.get('status') as "published" | "scheduled" | "draft" | undefined) ?? undefined,
        publishDate: (formData.get('publishDate') as string) ?? undefined,
        categories: JSON.parse(formData.get('categories') as string) as string[],
        featuredImage: (formData.get('featuredImage') as string) ?? undefined,
        metaTitle: (formData.get('metaTitle') as string) ?? undefined,
        metaDescription: (formData.get('metaDescription') as string) ?? undefined
    }

    await updateBlogPost(slug, update)
    redirect(`/dashboard/blog/${slug}`)
}
