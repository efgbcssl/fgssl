import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Eye } from 'lucide-react'
import { getBlogPosts } from '@/lib/blog'

export default async function AdminBlogPage() {
    const { data: posts = [], error } = await getBlogPosts(true);
    if (error) {
        return (
            <div className="container py-8">
                <div className="text-red-500">
                    Error loading posts: {error}
                </div>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="container py-8">
                <div className="border rounded-lg p-8 text-center">
                    <h2 className="text-xl font-semibold mb-2">No Blog Posts Found</h2>
                    <p className="text-gray-600 mb-4">
                        Create your first blog post to get started
                    </p>
                    <Button asChild>
                        <Link href="/dashboard/blog/new">
                            <Plus className="mr-2 h-4 w-4" /> Create New Post
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    // Handle case where posts is not an array
    if (!Array.isArray(posts)) {
        return (
            <div className="container py-8">
                <div className="text-red-500">Posts data is not in expected format</div>
            </div>
        )
    }

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

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Publish Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {posts.map((post) => (
                            <tr key={post.post_id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium text-gray-900">{post.title}</div>
                                    <div className="text-sm text-gray-500">{post.excerpt}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${post.status === 'published' ? 'bg-green-100 text-green-800' :
                                            post.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {post.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {post.publishDate || 'Not scheduled'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/dashboard/blog/${post.slug}`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/blog/${post.slug}`} target="_blank">
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/dashboard/blog/${post.slug}/comments`}>
                                                <span className="relative">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                                    </svg>
                                                    {post.commentCount > 0 && (
                                                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                                            {post.commentCount}
                                                        </span>
                                                    )}
                                                </span>
                                            </Link>
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}