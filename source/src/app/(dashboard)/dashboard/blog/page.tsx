"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
    Plus,
    Edit,
    Eye,
    MessageCircle,
    Trash2,
    RefreshCcw,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Post Type
interface Post {
    post_id: string;
    title: string;
    excerpt: string;
    slug: string;
    status: "draft" | "published";
    publishDate?: string;
    commentCount?: number;
}

interface PostsResponse {
    posts: Post[];
    cursor: string;
    more: boolean;
    size: number;
    pages: number;
}

// API: Fetch posts
async function fetchPosts({
    page,
    search,
    status,
}: {
    page: number;
    search: string;
    status: string;
}) {
    const query = new URLSearchParams();
    query.set("page", String(page));

    if (search) query.set("search", search);
    if (status && status !== "all") query.set("status", status);

    const res = await fetch(`/api/blog/posts?${query.toString()}`);
    //   const res = await fetch(`/api/blog/posts`)
    // console.log("response is", await res.json())

    if (!res.ok) throw new Error("Failed to fetch posts");

    const { meta, records, recordsCount } = await res.json();
    // console.log("meta", meta)
    // console.log("records", records)
    const postsResponse: PostsResponse = {
        cursor: meta.page.cursor,
        more: meta.page.more,
        size: meta.page.size,
        posts: records,
        pages: recordsCount
    }
    return postsResponse;
}

// API: Delete post
async function deletePost(postId: string) {
    const res = await fetch(`/api/dashboard/blog/posts/${postId}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete post");
}

// API: Toggle post status
async function toggleStatus(postId: string, currentStatus: string) {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    const res = await fetch(`/api/dashboard/blog/posts/${postId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) throw new Error("Failed to update status");
    return newStatus;
}

export default function AdminBlogPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [loading, setLoading] = useState(false);

    // ✅ useCallback to fix missing dependency warning
    const loadPosts = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchPosts({ page, search, status: statusFilter });

            console.log("--------------------------data in =====================")
            console.log(data)

            setPosts(data.posts);
            setTotalPages(data.pages);
            setLoading(false)

        } catch (error) {
            if (error instanceof Error) {
                toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Error",
                    description: "Something went wrong",
                    variant: "destructive",
                });
            }
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter, setLoading]);

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    const handleDelete = async (postId: string, title: string) => {
        if (
            !confirm(
                `Are you sure you want to delete the post "${title}"? This action cannot be undone.`
            )
        )
            return;
        try {
            await deletePost(postId);
            toast({ title: "Deleted", description: `Post "${title}" deleted.` });
            setPage(1);
            loadPosts();
        } catch (error) {
            if (error instanceof Error) {
                toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive",
                });
            }
        }
    };

    const handleToggleStatus = async (postId: string, currentStatus: string) => {
        try {
            const newStatus = await toggleStatus(postId, currentStatus);
            toast({
                title: "Updated",
                description: `Status changed to "${newStatus}".`,
            });
            loadPosts();
        } catch (error) {
            if (error instanceof Error) {
                toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive",
                });
            }
        }
    };

    return (
        <div className="container py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Blog Management</h1>
                <Button asChild>
                    <Link href="/dashboard/blog/new">
                        <Plus className="mr-2 h-4 w-4" /> New Post
                    </Link>
                </Button>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-4 mb-6">
                <input
                    type="search"
                    placeholder="Search posts..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border px-3 py-2 rounded-md flex-grow"
                    disabled={loading}
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border px-3 py-2 rounded-md"
                    disabled={loading}
                >
                    <option value="all">All Statuses</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                </select>
                <Button
                    variant="outline"
                    onClick={loadPosts}
                    disabled={loading}
                    title="Reload"
                >
                    <RefreshCcw className="h-5 w-5" />
                </Button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Title
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Publish Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {posts.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-6 text-gray-500">
                                    No posts found.
                                </td>
                            </tr>
                        )}
                        {posts.map((post) => (
                            <tr key={post.post_id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium text-gray-900">{post.title}</div>
                                    <div className="text-sm text-gray-500">{post.excerpt}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${post.status === "published"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-yellow-100 text-yellow-800"
                                            }`}
                                    >
                                        {post.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {post.publishDate
                                        ? new Date(post.publishDate).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        })
                                        : "Not scheduled"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link
                                                href={`/dashboard/blog/${post.slug}`}
                                                aria-label={`Edit post: ${post.title}`}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link
                                                href={`/blog/${post.slug}`}
                                                target="_blank"
                                                aria-label={`View post: ${post.title}`}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link
                                                href={`/dashboard/blog/${post.slug}/comments`}
                                                aria-label={`Comments for: ${post.title}`}
                                            >
                                                <span className="relative">
                                                    <MessageCircle className="h-4 w-4" />
                                                    {(post.commentCount ?? 0) > 0 && (
                                                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                                            {post.commentCount}
                                                        </span>
                                                    )}
                                                </span>
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleToggleStatus(post.post_id, post.status)
                                            }
                                            title={`Toggle status from ${post.status}`}
                                        >
                                            {post.status === "published" ? "Unpublish" : "Publish"}
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(post.post_id, post.title)}
                                            title="Delete post"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
                <Button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page <= 1 || loading}
                >
                    Previous
                </Button>
                <div>
                    Page {page} of {totalPages}
                </div>
                <Button
                    onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
                    disabled={page >= totalPages || loading}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
