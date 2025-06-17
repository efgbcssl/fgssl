/*import { xata, ApiResponse } from './xata';
import { LikeToggle } from './types';

export const toggleLike = async (
    likeData: LikeToggle
): Promise<ApiResponse<{ liked: boolean }>> => {
    try {
        const { postId, commentId, userId } = likeData;

        // Check if like already exists
        const existingLike = await xata.db.likes
            .filter({
                postId,
                ...(commentId ? { commentId } : { commentId: null }),
                userId
            })
            .getFirst();

        if (existingLike) {
            // Unlike - delete the existing like
            await xata.db.likes.delete(existingLike.id);

            // Decrement like count
            if (commentId) {
                await xata.db.comments.update(commentId, {
                    likes: { $decrement: 1 }
                });
            } else {
                await xata.db.posts.update(postId, {
                    likes: { $decrement: 1 }
                });
            }

            return {
                data: { liked: false },
                status: 200
            };
        } else {
            // Like - create new like
            await xata.db.likes.create({
                postId,
                commentId: commentId || null,
                userId
            });

            // Increment like count
            if (commentId) {
                await xata.db.comments.update(commentId, {
                    likes: { $increment: 1 }
                });
            } else {
                await xata.db.posts.update(postId, {
                    likes: { $increment: 1 }
                });
            }

            return {
                data: { liked: true },
                status: 200
            };
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        return {
            error: 'Failed to toggle like',
            status: 500
        };
    }
};

export const checkLikeStatus = async (
    postId: string,
    commentId: string | null,
    userId: string
): Promise<ApiResponse<{ liked: boolean }>> => {
    try {
        const like = await xata.db.likes
            .filter({
                postId,
                ...(commentId ? { commentId } : { commentId: null }),
                userId
            })
            .getFirst();

        return {
            data: { liked: !!like },
            status: 200
        };
    } catch (error) {
        console.error('Error checking like status:', error);
        return {
            error: 'Failed to check like status',
            status: 500
        };
    }
};

export const getLikesCount = async (
    postId: string,
    commentId?: string
): Promise<ApiResponse<number>> => {
    try {
        const count = await xata.db.likes
            .filter({
                postId,
                ...(commentId ? { commentId } : { commentId: null })
            })
            .getCount();

        return {
            data: count,
            status: 200
        };
    } catch (error) {
        console.error('Error getting likes count:', error);
        return {
            error: 'Failed to get likes count',
            status: 500
        };
    }
};*/