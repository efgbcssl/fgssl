/*import { CommentModeration } from '@/components/blog/CommentModeration'
import { getCommentsByPostId } from '@/lib/comments'

export default async function BlogPostComments({ params }: { params: { slug: string } }) {
    const comments = await getBlogPostComments(params.slug)

    return (
        <div className="container py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manage Comments</h1>
                <p className="text-sm text-gray-500">
                    {comments.length} comment{comments.length !== 1 ? 's' : ''}
                </p>
            </div>

            <CommentModeration
                comments={comments}
                postSlug={params.slug}
            />
        </div>
    )
}*/