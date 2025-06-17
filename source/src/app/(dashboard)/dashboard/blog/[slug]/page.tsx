// src/app/(dashboard)/dashboard/blog/[slug]/page.tsx
import { BlogEditor } from '@/components/blog/BlogEditor'
import { getBlogPostBySlug } from '@/lib/blog'
import { notFound } from 'next/navigation'
import { handleEditBlogSubmit } from '@/actions/blogActions'

export default async function EditBlogPost({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = await getBlogPostBySlug(slug);
    if (!post?.data) {
        notFound();
    }
    return (
        <div className="container py-8">
            <h1 className="text-2xl font-bold mb-6">Edit Blog Post</h1>
            <BlogEditor
                action={(formData) => handleEditBlogSubmit(slug, formData)}
                defaultValues={{
                    title: post.data.title,
                    content: post.data.content,
                    excerpt: post.data.excerpt,
                    status: post.data.status,
                    publishDate: post.data.publishDate ?? '',
                    featuredImage: post.data.featuredImage ?? '',
                    metaTitle: post.data.metaTitle ?? '',
                    metaDescription: post.data.metaDescription ?? ''
                }}
            />
        </div>
    )
}
