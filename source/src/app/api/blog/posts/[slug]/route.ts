import { NextResponse } from "next/server";
import { xata } from "@/lib/xata";
// import { BlogPost } from '@/types/blog';

// Get all blog posts
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    console.log("in get post slug")
    try {
        if (slug) {
            const posts = await xata.db.posts
                .filter({ "slug": slug })
                .getFirst();

            return NextResponse.json(posts);
        }
    } catch (error) {
        console.error("Error fetching blog posts:", error);
        return NextResponse.json(
            { error: "Failed to fetch blog posts" },
            { status: 500 }
        );
    }
}