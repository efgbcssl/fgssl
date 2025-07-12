/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { xata } from "@/lib/xata";

// Get comments for a post
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");

  if (!postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  try {
    const comments = await xata.db.comments
      .filter({ postId })
      .sort("xata_createdat", "desc")
      .getMany();
    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await xata.db.comments
          .filter({ parentId: comment.xata_id })
          .sort("xata_createdat", "asc")
          .getMany();
        return {
          ...comment,
          replies,
        };
      })
    );

    return NextResponse.json(commentsWithReplies);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// Create a new comment or reply
export async function POST(request: Request) {
  const { postId, parentId, name, content } = await request.json();

  if (!postId || !name || !content) {
    return NextResponse.json(
      { error: "postId, name, and content are required" },
      { status: 400 }
    );
  }

  const post = await xata.db.posts.filter({ post_id: postId }).getFirst();

  if (!post) {
    return NextResponse.json({ error: "post doesn't exist" }, { status: 404 });
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

    if (!parentId) await post.update({ commentCount: { $increment: 1 } });

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

// Update a comment or reply
export async function PATCH(request: Request) {
  const { postId, name, content, xata_id } = await request.json();

  if (!postId || !name || !content) {
    return NextResponse.json(
      { error: "postId, name, and content are required" },
      { status: 400 }
    );
  }

  const post = await xata.db.posts.filter({ post_id: postId }).getFirst();

  if (!post) {
    return NextResponse.json({ error: "post doesn't exist" }, { status: 404 });
  }

  const comment = await xata.db.comments.filter({ xata_id }).getFirst();

  if (!comment) {
    return NextResponse.json(
      { error: "comment doesn't exist" },
      { status: 404 }
    );
  }

  try {
    const updatedComment = await comment.update({ content: content });

    return NextResponse.json(updatedComment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

// Delete a comment or reply
export async function DELETE(request: Request) {
  const { postId, name, content, xata_id } = await request.json();

  if (!postId || !name || !content) {
    return NextResponse.json(
      { error: "postId, name, and content are required" },
      { status: 400 }
    );
  }

  const post = await xata.db.posts.filter({ post_id: postId }).getFirst();

  if (!post) {
    return NextResponse.json({ error: "post doesn't exist" }, { status: 404 });
  }

  const comment = await xata.db.comments.filter({ xata_id }).getFirst();

  if (!comment) {
    return NextResponse.json(
      { error: "comment doesn't exist" },
      { status: 404 }
    );
  }

  try {
    if (!comment.parentId) post.update({ commentCount: { $decrement: 1 } });

    await comment.delete();

    return NextResponse.json({ deletedComment: true }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
