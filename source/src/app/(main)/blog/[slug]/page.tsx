import { notFound } from 'next/navigation'
import { xata } from '@/lib/xata'
//import { BlogPost } from '@/types/blog'
import { CommentSection } from '@/components/blog/CommentSection'
import { ThumbsUp } from 'lucide-react'

export default async function BlogPostPage({
    params,
    searchParams
}: {
    params: { slug: string },
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const post = await xata.db.posts.filter({ slug: params.slug }).getFirst()

    if (!post) {
        return notFound()
    }

    // Fetch comments for this post
    const commentsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/blog/comments?postId=${post.post_id}`,
        { cache: 'no-store' }
    )
    const comments = await commentsResponse.json()

    return (
        <div className="max-w-3xl mx-auto py-8">
            <article className="prose lg:prose-xl">
                <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
                <div className="mb-4">
                    {post.categories?.map(category => (
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
                            day: 'numeric'
                        })}
                    </span>
                    <span>•</span>
                    <button className="flex items-center gap-1 hover:text-blue-500">
                        <ThumbsUp className="h-4 w-4" /> {post.likes} Like{post.likes !== 1 ? 's' : ''}
                    </button>
                </div>
            </article>

            <CommentSection
                postSlug={params.slug}
                postId={post.post_id}
                userId={searchParams.userId as string} // You'll need to implement user auth
                initialComments={comments}
            />
        </div>
    )
}