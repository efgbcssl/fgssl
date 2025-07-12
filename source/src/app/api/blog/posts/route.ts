import { NextResponse } from "next/server";
import { xata } from "@/lib/xata";
// import { BlogPost } from '@/types/blog';
// import { v4 as uuidv4 } from 'uuid';

// Get all blog posts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const adminView = searchParams.get("adminView") === "true";
  const nextPage = !Number.isNaN(searchParams.get("page"))
    ? Number(searchParams.get("page"))
    : 1;
  const status = searchParams.get("status");
  const size = !Number.isNaN(searchParams.get("size"))
    ? Number(searchParams.get("size"))
    : 5;

  try {
    let posts;

    if (adminView) {
      posts = await xata.db.posts.sort("createdAt", "desc").getMany();
      // console.log("blog posts in if", posts)
    } else if (status) {
      posts = await xata.db.posts
        .sort("publishDate", "desc")
        .filter({ status: status })
        .getPaginated({ pagination: { size: 5, offset: (nextPage - 1) * 5 } });
    } else {
      //use the aggregate when using paid xata
      // const length = await xata.db.posts.aggregate({
      //   totalCount: {
      //     count: "*",
      //   },
      // });

      posts = await xata.db.posts.sort("publishDate", "desc").getPaginated({
        pagination: { size: size, offset: (nextPage - 1) * 5 },
      });
    }

    const recordsCount = Math.ceil(
      (await (await xata.db.posts.getMany()).length) / 5
    );
    const response = { ...posts, recordsCount };
    // console.log("response is", response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}

// Create a new blog post
export async function POST(request: Request) {
  const {
    post_id,
    title,
    content,
    excerpt,
    status,
    publishDate,
    categories,
    featuredImage,
    metaTitle,
    metaDescription,
    createdAt,
    updatedAt,
  } = await request.json();

  if (!title || !content || !excerpt || !status) {
    return NextResponse.json(
      { error: "Required fields are missing" },
      { status: 400 }
    );
  }

  try {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const newPost = await xata.db.posts.create({
      post_id,
      title,
      slug,
      content,
      excerpt,
      status,
      publishDate: publishDate || null,
      categories: categories || [],
      featuredImage: featuredImage || "",
      metaTitle: metaTitle || "",
      metsDescription: metaDescription || "",
      likes: 0,
      createdAt,
      updatedAt,
      commentCount: 0,
    });

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error("Error creating blog post:", error);
    return NextResponse.json(
      { error: "Failed to create blog post" },
      { status: 500 }
    );
  }
}

// Update an existing blog post
export async function PUT(request: Request) {
    const {
      post_id,
      title,
      content,
      excerpt,
      status,
      publishDate,
      categories,
      featuredImage,
      metaTitle,
      metaDescription,
      createdAt,
      updatedAt,
    } = await request.json();


  const post = await xata.db.posts.filter({ post_id: post_id }).getFirst();

  if (!post_id) {
    return NextResponse.json({ error: "post id required" }, { status: 400 });
  }

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  try {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const postToBeUpdated = {
      post_id,
      title: title ? title : post.title,
      slug: slug ? slug : post.slug,
      content: content ? content : post.content,
      excerpt: excerpt ? excerpt : post.excerpt,
      status: status ? status : post.status,
      publishDate: publishDate ? publishDate : post.publishDate,
      categories: categories ? categories : post.categories,
      featuredImage: featuredImage ? featuredImage : post.featuredImage,
      metaTitle: metaTitle ? metaTitle : post.metaTitle,
      metsDescription: metaDescription ? metaDescription : post.metsDescription,
      likes: 0,
      createdAt,
      updatedAt,
      commentCount: 0,
    };

    const newPost = await post.update({ ...postToBeUpdated });

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error("Error updating blog post:", error);
    return NextResponse.json(
      { error: "Failed to update blog post" },
      { status: 500 }
    );
  }
}

//Delete a blog post
export async function DELETE(request: Request) {
  const {
    post_id
  } = await request.json();

  
  const post = await xata.db.posts.filter({ post_id: post_id }).getFirst();

  if (!post_id) {
    return NextResponse.json({ error: "post id required" }, { status: 400 });
  }

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  try {

    const newPost = await post.delete();

    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return NextResponse.json(
      { error: "Failed to delete blog post" },
      { status: 500 }
    );
  }
}