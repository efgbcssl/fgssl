import { BlogEditor } from '@/components/blog/BlogEditor'
import { getBlogPostBySlug, updateBlogPost } from '@/lib/blog'
import { notFound, redirect } from 'next/navigation'

type Params = {
    params: {
        slug: string
    }
}

export default async function EditBlogPost({ params }: Params) {
    const post = await getBlogPostBySlug(params.slug)

    if (!post.data) {
        return notFound()
    }

    async function handleSubmit(formData: FormData) {
        'use server'
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
        await updateBlogPost(params.slug, update)
        redirect(`/dashboard/blog/${params.slug}`)
    }

    return (
        <div className="container py-8">
            <h1 className="text-2xl font-bold mb-6">Edit Blog Post</h1>
            <BlogEditor
                action={handleSubmit}
                defaultValues={{
                    title: post.data!.title,
                    content: post.data!.content,
                    excerpt: post.data!.excerpt,
                    status: post.data!.status,
                    publishDate: post.data!.publishDate ?? '',
                    categories: post.data!.categories,
                    featuredImage: post.data!.featuredImage ?? '',
                    metaTitle: post.data!.metaTitle ?? '',
                    metaDescription: post.data!.metaDescription ?? ''
                }}
            />
        </div>
    )
}