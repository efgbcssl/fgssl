import { xata, ApiResponse } from './xata';
import { BlogPost, BlogPostCreate, BlogPostUpdate } from './types';

export const getBlogPosts = async (adminView: boolean = false): Promise<ApiResponse<BlogPost[]>> => {
    try {
        const query = xata.db.posts.select([
            'post_id',
            'title',
            'content',
            'slug',
            'excerpt',
            'status',
            'publishDate',
            'categories',
            'createdAt',
            'commentCount',
            'updatedAt',
            'likes',
            'featuredImage',
            'metaTitle',
            'metaDescription'
        ]);

        const filteredQuery = adminView
            ? query
            : query.filter({
                $any: [
                    { status: 'published' },
                    {
                        status: 'scheduled',
                        publishDate: { $le: new Date().toISOString() }
                    }
                ]
            });

        const { records } = await filteredQuery
            .sort(adminView ? 'createdAt' : 'publishDate', 'desc')
            .getPaginated({ pagination: { size: 100 } });

        // Transform records to BlogPost format
        const posts = records.map(post => ({
            id: post.post_id,
            title: post.title || 'Untitled Post',
            slug: post.slug,
            content: post.content || '',
            excerpt: post.excerpt || '',
            status: post.status as 'published' | 'scheduled' | 'draft',
            publishDate: post.publishDate?.toISOString(),
            categories: post.categories || [],
            commentCount: post.commentCount || 0,
            likes: post.likes || 0,
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt?.toISOString(),
            featuredImage: post.featuredImage || undefined,
            metaTitle: post.metaTitle || undefined,
            metaDescription: post.metaDescription || undefined
        }));

        return {
            data: posts,
            status: 200,
            error: undefined
        };
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        return {
            data: [],
            status: 500,
            error: error instanceof Error ? error.message : 'Failed to fetch posts'
        };
    }
};

export const getBlogPostBySlug = async (slug: string): Promise<ApiResponse<BlogPost>> => {
    try {
        const record = await xata.db.posts.filter({ slug }).getFirst();

        if (!record) {
            return {
                data: undefined,
                status: 404,
                error: 'Post not found'
            };
        }

        return {
            data: transformPost(record),
            status: 200,
            error: undefined
        };
    } catch (error) {
        console.error('Error fetching blog post:', error);
        return {
            data: undefined,
            status: 500,
            error: error instanceof Error ? error.message : 'Failed to fetch post'
        };
    }
};

export const createBlogPost = async (postData: BlogPostCreate): Promise<ApiResponse<BlogPost>> => {
    try {
        const slug = generateSlug(postData.title);
        const post_id = crypto.randomUUID();
        const record = await xata.db.posts.create({
            ...postData,
            post_id,
            slug,
            likes: 0,
            categories: postData.categories || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishDate: postData.publishDate || new Date().toISOString(),
        });

        if (!record) {
            throw new Error('Failed to create post record');
        }

        return {
            data: transformPost(record),
            status: 201,
            error: undefined
        };
    } catch (error) {
        console.error('Error creating blog post:', error);
        return {
            data: undefined,
            status: 500,
            error: error instanceof Error ? error.message : 'Failed to create post'
        };
    }
};

export const updateBlogPost = async (
    id: string,
    postData: BlogPostUpdate
): Promise<ApiResponse<BlogPost>> => {
    try {
        const updateData = { ...postData };

        if (postData.title) {
            updateData.slug = generateSlug(postData.title);
        }

        const record = await xata.db.posts.update(id, updateData);

        if (!record) {
            return {
                data: undefined,
                status: 404,
                error: 'Post not found'
            };
        }

        return {
            data: transformPost(record),
            status: 200,
            error: undefined
        };
    } catch (error) {
        console.error('Error updating blog post:', error);
        return {
            data: undefined,
            status: 500,
            error: error instanceof Error ? error.message : 'Failed to update post'
        };
    }
};

export const deleteBlogPost = async (id: string): Promise<ApiResponse<void>> => {
    try {
        await xata.db.posts.delete(id);
        return {
            data: undefined,
            status: 204,
            error: undefined
        };
    } catch (error) {
        console.error('Error deleting blog post:', error);
        return {
            data: undefined,
            status: 500,
            error: error instanceof Error ? error.message : 'Failed to delete post'
        };
    }
};

// Helper functions
const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};

const transformPost = (post: any): BlogPost => ({
    id: post.post_id,
    title: post.title || 'Untitled Post',
    slug: post.slug,
    content: post.content || '',
    excerpt: post.excerpt || '',
    status: post.status as 'published' | 'scheduled' | 'draft',
    publishDate: post.publishDate?.toISOString(),
    categories: post.categories || [],
    commentCount: post.commentCount || 0,
    likes: post.likes || 0,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt?.toISOString(),
    featuredImage: post.featuredImage || undefined,
    metaTitle: post.metaTitle || undefined,
    metaDescription: post.metaDescription || undefined
});