import { connectMongoDB } from "@/lib/mongodb";
import { BlogModel, IBlog } from "@/models/Blog";
import mongoose from "mongoose";

export interface ApiResponse<T> {
    data: T | undefined;
    status: number;
    error?: string;
}

const generateSlug = (title: string): string => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
};

const transformPost = (post: IBlog) => ({
    post_id: post.post_id,
    title: post.title,
    slug: post.slug,
    content: post.content || "",
    excerpt: post.excerpt || "",
    status: post.status,
    publishDate: post.publishDate ? post.publishDate.toISOString() : undefined,
    categories: post.categories || [],
    likes: post.likes || 0,
    commentCount: post.commentCount || 0,
    featuredImage: post.featuredImage,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
});

// --- CRUD Functions ---

export const getBlogPosts = async (
    adminView = false
): Promise<ApiResponse<ReturnType<typeof transformPost>[]>> => {
    try {
        await connectMongoDB();

        const filter = adminView
            ? {}
            : {
                $or: [
                    { status: "published" },
                    { status: "scheduled", publishDate: { $lte: new Date() } },
                ],
            };

        const posts = await BlogModel.find(filter)
            .sort(adminView ? { createdAt: -1 } : { publishDate: -1 })
            .limit(100)
            .lean();

        return {
            data: posts.map((p) => transformPost(p as IBlog)),
            status: 200,
        };
    } catch (error) {
        console.error("Error fetching blog posts:", error);
        return {
            data: [],
            status: 500,
            error: error instanceof Error ? error.message : "Failed to fetch posts",
        };
    }
};

export const getBlogPostBySlug = async (
    slug: string
): Promise<ApiResponse<ReturnType<typeof transformPost>>> => {
    try {
        await connectMongoDB();
        const post = await BlogModel.findOne({ slug }).lean();

        if (!post) {
            return { data: undefined, status: 404, error: "Post not found" };
        }

        return { data: transformPost(post as IBlog), status: 200 };
    } catch (error) {
        console.error("Error fetching blog post:", error);
        return {
            data: undefined,
            status: 500,
            error: error instanceof Error ? error.message : "Failed to fetch post",
        };
    }
};

export const createBlogPost = async (
    postData: Partial<IBlog>
): Promise<ApiResponse<ReturnType<typeof transformPost>>> => {
    try {
        await connectMongoDB();
        const slug = generateSlug(postData.title as string);
        const post_id = new mongoose.Types.ObjectId().toString();

        const newPost = new BlogModel({
            ...postData,
            post_id,
            slug,
            likes: 0,
            categories: postData.categories || [],
            publishDate: postData.publishDate || new Date(),
        });

        const saved = await newPost.save();
        return { data: transformPost(saved), status: 201 };
    } catch (error) {
        console.error("Error creating blog post:", error);
        return {
            data: undefined,
            status: 500,
            error: error instanceof Error ? error.message : "Failed to create post",
        };
    }
};

export const updateBlogPost = async (
    id: string,
    postData: Partial<IBlog>
): Promise<ApiResponse<ReturnType<typeof transformPost>>> => {
    try {
        await connectMongoDB();
        const updateData: Partial<IBlog> = { ...postData };

        if (postData.title) {
            updateData.slug = generateSlug(postData.title);
        }

        const updated = await BlogModel.findOneAndUpdate(
            { post_id: id },
            updateData,
            { new: true }
        ).lean();

        if (!updated) {
            return { data: undefined, status: 404, error: "Post not found" };
        }

        return { data: transformPost(updated as IBlog), status: 200 };
    } catch (error) {
        console.error("Error updating blog post:", error);
        return {
            data: undefined,
            status: 500,
            error: error instanceof Error ? error.message : "Failed to update post",
        };
    }
};

export const deleteBlogPost = async (
    id: string
): Promise<ApiResponse<void>> => {
    try {
        await connectMongoDB();
        await BlogModel.findOneAndDelete({ post_id: id });
        return { data: undefined, status: 204 };
    } catch (error) {
        console.error("Error deleting blog post:", error);
        return {
            data: undefined,
            status: 500,
            error: error instanceof Error ? error.message : "Failed to delete post",
        };
    }
};
