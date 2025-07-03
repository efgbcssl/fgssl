/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import { xata } from '@/lib/xata';
import { Like } from '@/types/like';

// Toggle like on a post or comment
export async function POST(request: Request) {
    const { postId, commentId, userId } = await request.json();

    try {/*
        // Check if like already exists
        const existingLike = await xata.db.likes
            .filter({
                postId,
                ...(commentId ? { commentId } : { commentId: null }),
                userId,
            })
            .getFirst();

        if (existingLike) {
            // Unlike - delete the existing like
            await xata.db.likes.delete(existingLike.like_id);

            // Decrement like count
            if (commentId) {
                await xata.db.comments.update(commentId, {
                    likes: { $decrement: 1 },
                });
            } else {
                await xata.db.posts.update(postId, {
                    likes: { $decrement: 1 },
                });
            }

            return NextResponse.json({ liked: false });
        } else {
            // Like - create new like
            await xata.db.likes.create({
                postId,
                commentId: commentId || null,
                userId,
            });

            // Increment like count
            if (commentId) {
                await xata.db.comments.update(commentId, {
                    likes: { $increment: 1 },
                });
            } else {
                await xata.db.posts.update(postId, {
                    likes: { $increment: 1 },
                });
            }

            return NextResponse.json({ liked: true });
        }
    */} catch (error) {
        console.error('Error toggling like:', error);
        return NextResponse.json(
            { error: 'Failed to toggle like' },
            { status: 500 }
        );
    }
}

// Get like status for a user
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const commentId = searchParams.get('commentId');
    const userId = searchParams.get('userId');

    if (!postId || !userId) {
        return NextResponse.json(
            { error: 'postId and userId are required' },
            { status: 400 }
        );
    }

    try {/*
        const like = await xata.db.likes
            .filter(
                commentId
                    ? { postId, commentId, userId }
                    : { postId, userId }
            )
            .getFirst();

        return NextResponse.json({ liked: !!like });
    */} catch (error) {
        console.error('Error checking like status:', error);
        return NextResponse.json(
            { error: 'Failed to check like status' },
            { status: 500 }
        );
    }
}