import { NextResponse } from "next/server";
import { xata } from "@/lib/xata";
// import { BlogPost } from '@/types/blog';
import { v4 as uuidv4 } from 'uuid';

// Get all blog posts
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const adminView = searchParams.get("adminView") === "true";
    const nextPage = !Number.isNaN(searchParams.get("page")) ? Number(searchParams.get("page")) : 1;
    const status = searchParams.get("status");
    const size = !Number.isNaN(searchParams.get("size")) ? Number(searchParams.get("size")) : 5;

    try {
        let posts;

        if (adminView) {
            posts = await xata.db.posts.sort("createdAt", "desc").getMany();
            // console.log("blog posts in if", posts)
        } else if (status) {
            posts = await xata.db.posts
                .sort("publishDate", "desc")
                .filter({ "status": status })
                .getPaginated({ pagination: { size: 5, offset: (nextPage - 1) * 5 } });

        }
        else {
            //use the aggregate when using paid xata
            // const length = await xata.db.posts.aggregate({
            //   totalCount: {
            //     count: "*",
            //   },
            // });

            posts = await xata.db.posts
                .sort("publishDate", "desc")
                .getPaginated({ pagination: { size: size, offset: (nextPage - 1) * 5 } });
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

const post_id = uuidv4();

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
