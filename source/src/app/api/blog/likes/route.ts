import { NextResponse } from "next/server";
import { xata } from "@/lib/xata";

// Toggle like on a post or comment
export async function POST(request: Request) {
  const { postId, commentId, userId } = await request.json();

  try {
    // Check if like already exists
    const existingLike = await xata.db.likes
      .filter({
        postId,
        userId,
      })
      .getFirst();

    if (!postId) {
      return NextResponse.json(
        { error: "Required fields are missing" },
        { status: 400 }
      );
    }
    if (existingLike) {
      return NextResponse.json({ liked: true });
    } else {
      // Unlike - delete the existing like
      const val = await xata.db.likes.create({ postId, commentId, userId });
      console.log("val", val)

      // Increment like count
      if (commentId) {
        const updated = await xata.db.comments.filter({ "xata_id" : commentId }).getFirstOrThrow()
        await updated.update({
          likes: { $increment: 1 },
        });
      } else {
        const updated = await xata.db.posts.filter({ "post_id" : postId }).getFirstOrThrow()
        await updated.update({
          likes: { $increment: 1 },
        });
        console.log("here", updated)
      }

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
// Toggle like on a post or comment
export async function DELETE(request: Request) {
  const { postId, commentId, userId } = await request.json();

  try {
    // Check if like already exists
    const existingLike = await xata.db.likes
      .filter({
        postId,
        userId,
      })
      .getFirst();

    if (!commentId || !postId) {
      return NextResponse.json(
        { error: "Required fields are missing" },
        { status: 400 }
      );
    }
    if (!existingLike) {
      return NextResponse.json(
        { error: "Like doesn't exist" },
        { status: 400 }
      );
    } else {
      if (commentId) {
        await xata.db.comments.update(commentId, {
          likes: { $decrement: 1 },
        });

        await existingLike.delete();
      } else {
        await xata.db.posts.update(postId, {
          likes: { $decrement: 1 },
        });

        await existingLike.delete();
      }

      return NextResponse.json({ removedLike: true });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}

// Get like status for a user
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");
  const commentId = searchParams.get("commentId");
  const userId = searchParams.get("userId");

  if (!postId || !userId) {
    return NextResponse.json(
      { error: "postId and userId are required" },
      { status: 400 }
    );
  }

  try {
    const like = await xata.db.likes
      .filter(commentId ? { postId, commentId, userId } : { postId, userId })
      .getFirst();

    return NextResponse.json({ liked: !!like });
  } catch (error) {
    console.error("Error checking like status:", error);
    return NextResponse.json(
      { error: "Failed to check like status" },
      { status: 500 }
    );
  }
}
