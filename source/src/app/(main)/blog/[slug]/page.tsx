/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ThumbsUp } from "lucide-react";
import { CommentSection } from "@/components/blog/CommentSection";
import { randomUUID } from "crypto";
import Image from "next/image";

interface Post {
  featuredImage: string;
  post_id: string;
  title: string;
  categories?: string[];
  content: string;
  createdAt: string;
  likes: number;
}

interface Like {
  commentId: string;
  postId: string;
  userId: string;
  xata_id: string;
}

export default function BlogPostPage() {
  console.log("In Blog Post Page");
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = params.slug;
  const userId = searchParams.get("userId") ?? "";

  const [post, setPost] = useState<Post | null>(null);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeObject, setLikeObject] = useState<Like | null>(null);
  const [loadingPost, setLoadingPost] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPost() {
      setLoadingPost(true);
      setError(null);
      try {
        const res = await fetch(`/api/blog/posts/${slug}?slug=${slug}`);
        if (!res.ok) throw new Error("Failed to fetch post");
        const data = await res.json();
        console.log("data in blog[slug]", data);
        if (!data) {
          setError("Post not found");
          setPost(null);
        } else {
          setPost(data);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Something went wrong");
        }
        setPost(null);
      } finally {
        setLoadingPost(false);
      }
    }

    fetchPost();
  }, [slug]);

  useEffect(() => {
    async function fetchLikes() {
      setLoadingPost(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/blog/likes?postId=${post?.post_id}&userId=${"b90abfbe-6129-9f74-a417-9a82d4385478"}`
        );

        const data = await res.json();
        console.log("data in blog[likes]", data);
        if (data) {
          setLiked(data?.liked);
          setLikeObject(data?.likeObject);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Something went wrong");
        }
        // setPost(null);
      } finally {
        setLoadingPost(false);
      }
    }

    fetchLikes();
  }, [post?.post_id]);


  const updateLikes = async () => {
    setError(null);
    if (liked === false) {
      console.log("here in updatelikes");
      try {
        const res = await fetch("/api/blog/likes", {
          method: "POST",
          body: JSON.stringify({
            postId: post?.post_id,
            userId: "b90abfbe-6129-9f74-a417-9a82d4385478",
          }),
          // …
        });
        if (!res.ok) throw new Error("Failed to fetch post");
        const data = await res.json();
        console.log("data in update likes", data);
        if (!data) {
          setError("Post not found");
          setLikes(0);
        } else {
          if (likes > 0) setLikes(likes + 1);
          else if (post?.likes) setLikes(post?.likes + 1);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Something went wrong");
        }
      }
    } else {
      const res = await fetch(
        `/api/blog/likes?postId=${post?.post_id}&userId=${likeObject?.userId}&commentId=`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (data.removedLike && post?.likes && post?.likes > 0)
        if (likes > 0) setLikes(likes - 1);
        else setLikes(post?.likes - 1);
    }

    console.log("liked", liked);
    console.log("likeObject", likeObject);
  };


  if (loadingPost) {
    return <p className="text-center py-10">Loading post...</p>;
  }

  if (error) {
    return (
      <p className="text-center py-10 text-red-600">An error occured {error}</p>
    );
  }

  if (!post) {
    return <p className="text-center py-10">Post not found.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <article className="prose lg:prose-xl">
        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
        <div className="mb-4">
          <Image
            className="h-auto max-w-full"
            src={post.featuredImage}
            alt="image description"
          />
        </div>

        <div className="mb-4">
          {post.categories?.map((category) => (
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
            {new Date(post.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span>•</span>
          <button
            className="flex items-center gap-1 hover:text-blue-500"
            aria-label="Likes"
            onClick={updateLikes}
          >
            <ThumbsUp className="h-4 w-4" /> {likes === 0 ? post.likes : likes}{" "}
            Like
            {post.likes !== 1 ? "s" : ""}
          </button>
        </div>
      </article>
      <CommentSection
        initialComments={[]}
        postId={post.post_id}
        userId={"b90abfbe-6129-9f74-a417-9a82d4385471"}
      />
    </div>
  );
}
