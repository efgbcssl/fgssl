import { BlogEditor } from '@/components/blog/BlogEditor'
import { createBlogPost } from '@/lib/blog'
import { redirect } from 'next/navigation'

type BlogPost = {
    title: string;
    content: string;
    excerpt: string;
    status: "draft" | "published" | "scheduled";
    publishDate: string;
    categories: string[];
    featuredImage: string;
    metaTitle: string;
    metaDescription: string;
};

export default function NewBlogPost() {
    async function handleSubmit(formData: FormData) {
        'use server'
        const blogPost: BlogPost = {
            title: (formData.get('title') as string) || '',
            content: (formData.get('content') as string) || '',
            excerpt: (formData.get('excerpt') as string) || '',
            status: (['draft', 'published', 'scheduled'].includes(formData.get('status') as string)
                ? (formData.get('status') as "draft" | "published" | "scheduled")
                : 'draft'),
            publishDate: (formData.get('publishDate') as string) || new Date().toISOString(),
            categories: (formData.getAll('categories') as string[]) || [],
            featuredImage: (formData.get('featuredImage') as string) || '',
            metaTitle: (formData.get('metaTitle') as string) || '',
            metaDescription: (formData.get('metaDescription') as string) || ''
        }
        const result = await createBlogPost(blogPost)
        if (result.data && result.data.slug) {
            redirect(`/dashboard/blog/${result.data.slug}`)
        } else {
            // Handle error or fallback here
            throw new Error('Failed to create blog post or missing slug.')
        }
    }

    return (
        <div className="container py-8">
            <h1 className="text-2xl font-bold mb-6">Create New Blog Post</h1>
            <BlogEditor
                action={handleSubmit}
                defaultValues={{
                    title: '',
                    content: '',
                    excerpt: '',
                    status: 'draft',
                    publishDate: '',
                    categories: [],
                    featuredImage: '',
                    metaTitle: '',
                    metaDescription: ''
                }}
            />
        </div>
    )
}