import { xata, ApiResponse } from './xata';
import { Comment, CommentCreate } from './types';

export const getCommentsByPostId = async (postId: string): Promise<ApiResponse<Comment[]>> => {
    try {
        const comments = await xata.db.comments
            .filter({ postId, parentId: undefined })
            .sort('createdAt', 'desc')
            .getAll();

        // Get replies for each comment
        const commentsWithReplies = await Promise.all(
            comments.map(async comment => {
                const replies = await xata.db.comments
                    .filter({ parentId: comment.comment_id })
                    .sort('createdAt', 'asc')
                    .getAll();

                // Map postId and parentId to string if they are Link objects
                const mapComment = (c: Comment) => ({
                    ...c,
                    postId: typeof c.postId === 'object' && (c.postId as { id?: string })?.id ? (c.postId as { id: string }).id : c.postId,
                    parentId: typeof c.parentId === 'object' && (c.parentId as { id?: string })?.id ? (c.parentId as { id: string }).id : c.parentId,
                });

                return {
                    ...mapComment(comment),
                    replies: replies.map(mapComment)
                };
            })
        );

        return {
            data: commentsWithReplies,
            status: 200
        };
    } catch (error) {
        console.error('Error fetching comments:', error);
        return {
            error: 'Failed to fetch comments',
            status: 500
        };
    }
};

export const createComment = async (
    commentData: CommentCreate
): Promise<ApiResponse<Comment>> => {
    try {
        // Auto-hide top-level comments for moderation
        const isHidden = !commentData.parentId;

        const record = await xata.db.comments.create({
            ...commentData,
            isHidden,
            likes: 0
        });

        return {
            data: record,
            status: 201
        };
    } catch (error) {
        console.error('Error creating comment:', error);
        return {
            error: 'Failed to create comment',
            status: 500
        };
    }
};

export const updateComment = async (
    id: string,
    updates: Partial<Comment>
): Promise<ApiResponse<Comment>> => {
    try {
        const record = await xata.db.comments.update(comment_id, updates);

        if (!record) {
            return {
                error: 'Comment not found',
                status: 404
            };
        }

        return {
            data: record,
            status: 200
        };
    } catch (error) {
        console.error('Error updating comment:', error);
        return {
            error: 'Failed to update comment',
            status: 500
        };
    }
};

export const deleteComment = async (id: string): Promise<ApiResponse<void>> => {
    try {
        // First delete all replies
        await xata.db.comments.filter({ parentId: id }).delete();

        // Then delete the comment itself
        await xata.db.comments.delete(id);

        return {
            status: 204
        };
    } catch (error) {
        console.error('Error deleting comment:', error);
        return {
            error: 'Failed to delete comment',
            status: 500
        };
    }
};