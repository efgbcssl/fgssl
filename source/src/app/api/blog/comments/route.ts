/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import { xata } from '@/lib/xata';
import { BlogComment } from '@/types/blogComment';

// Get comments for a post
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
        return NextResponse.json(
            { error: 'postId is required' },
            { status: 400 }
        );
    }

    try {
        const comments = await xata.db.comments
            .filter({ postId })
            .sort('createdAt', 'desc')
            .getMany();

        // Get replies for each comment
        const commentsWithReplies = await Promise.all(
            comments.map(async (comment) => {
                const replies = await xata.db.comments
                    .filter({ parentId: comment.comment_id })
                    .sort('createdAt', 'asc')
                    .getMany();
                return {
                    ...comment,
                    replies,
                };
            })
        );

        return NextResponse.json(commentsWithReplies);
    } catch (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json(
            { error: 'Failed to fetch comments' },
            { status: 500 }
        );
    }
}

// Create a new comment or reply
export async function POST(request: Request) {
    const { postId, parentId, name, content } = await request.json();

    if (!postId || !name || !content) {
        return NextResponse.json(
            { error: 'postId, name, and content are required' },
            { status: 400 }
        );
    }

    try {
        const newComment = await xata.db.comments.create({
            postId,
            parentId: parentId || null,
            name,
            content,
            isHidden: !parentId, // Auto-hide top-level comments for moderation
            likes: 0,
        });

        return NextResponse.json(newComment, { status: 201 });
    } catch (error) {
        console.error('Error creating comment:', error);
        return NextResponse.json(
            { error: 'Failed to create comment' },
            { status: 500 }
        );
    }
}