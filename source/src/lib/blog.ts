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
            'metsDescription'
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
            post_id: post.post_id,
            id: post.post_id,
            title: post.title || 'Untitled Post',
            slug: post.slug,
            content: post.content || '',
            excerpt: post.excerpt || '',
            status: post.status as 'published' | 'scheduled' | 'draft',
            publishDate: post.publishDate?.toISOString(),
            categories: post.categories || [],
            // commentCount: post.commentCount || 0,
            likes: post.likes || 0,
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt?.toISOString() ?? '',
            featuredImage: post.featuredImage || undefined,
            metaTitle: post.metaTitle || undefined,
            metaDescription: post.metsDescription || undefined
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
            //data: transformPost(),
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
            return {
                data: undefined,
                status: 500,
                error: 'Failed to create post'
            };
        }

        return {
            /*data: transformPost({
                ...record,
                categories: record.categories ?? undefined,
                featuredImage: record.featuredImage ?? undefined,
                metaTitle: record.metaTitle != null ? record.metaTitle as string : undefined,
                metaDescription: record.metaDescription != null ? record.metaDescription as string : undefined
            }),*/
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
            /*data: transformPost({
                ...record,
                categories: record.categories ?? undefined,
                featuredImage: record.featuredImage ?? undefined,
                metaTitle: record.metaTitle != null ? record.metaTitle as string : undefined,
                metaDescription: record.metaDescription != null ? record.metaDescription as string : undefined
            }),*/
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
// Replace 'PostRecord' with the actual type returned by xata.db.posts, e.g., from Xata codegen

// Remove the strict XataPostRecord interface and accept any object with the required fields
const transformPost = (post: {
    post_id: string;
    title?: string;
    slug: string;
    content?: string;
    excerpt?: string;
    status: string;
    publishDate?: Date | string | null;
    categories?: string[];
    commentCount?: number;
    likes?: number;
    createdAt: Date | string;
    updatedAt?: Date | string;
    featuredImage?: string;
    metaTitle?: string;
    metaDescription?: string;
}): BlogPost => ({
    post_id: post.post_id,
    title: post.title || 'Untitled Post',
    slug: post.slug,
    content: post.content || '',
    excerpt: post.excerpt || '',
    status: (post.status as 'published' | 'scheduled' | 'draft'),
    publishDate: post.publishDate
        ? typeof post.publishDate === 'string'
            ? post.publishDate
            : post.publishDate.toISOString()
        : undefined,
    categories: post.categories || [],
    likes: post.likes || 0,
    createdAt: typeof post.createdAt === 'string'
        ? post.createdAt
        : post.createdAt.toISOString(),
    updatedAt: post.updatedAt
        ? typeof post.updatedAt === 'string'
            ? post.updatedAt
            : post.updatedAt.toISOString()
        : '',
    featuredImage: post.featuredImage || undefined,
    metaTitle: post.metaTitle || undefined,
    metaDescription: post.metaDescription || undefined
});