// Blog Post Types
export interface BlogPost {
    post_id: string;
    title: string;
    slug?: string;
    content: string;
    excerpt: string;
    status: 'draft' | 'published' | 'scheduled';
    publishDate?: string | null;
    categories: string[];
    featuredImage?: string;
    metaTitle?: string;
    metaDescription?: string;
    likes: number;
    createdAt: string;
    updatedAt: string;

}

export interface BlogPostCreate extends Omit<BlogPost, 'post_id' | 'slug' | 'likes' | 'createdAt' | 'updatedAt'> {
    title: string;
    content: string;
    excerpt: string;
    status: 'draft' | 'published' | 'scheduled';
}

export interface BlogPostUpdate extends Partial<Omit<BlogPost, 'post_id' | 'slug' | 'likes' | 'createdAt' | 'updatedAt'>> {
    title?: string;
    status?: "published" | "scheduled" | "draft";
    content?: string;
    categories?: string[];
    excerpt?: string;
    featuredImage?: string;
    metaDescription?: string;
    metaTitle?: string;
    publishDate?: string;
    slug?: string; // Allow updating slug

};

// Comment Types
export interface Comment {
    comment_id: string;
    postId: string;
    parentId: string | null;
    name: string;
    content: string;
    isHidden: boolean;
    likes: number;
    createdAt: string;
    replies?: Comment[];
}

export interface CommentCreate extends Omit<Comment, 'comment_id' | 'isHidden' | 'likes' | 'createdAt' | 'replies'> {
    name: string;
    content: string;
}

// Like Types
export interface Like {
    like_id: string;
    postId: string;
    commentId: string | null;
    userId: string;
    createdAt: string;
}

export interface LikeToggle {
    postId: string;
    commentId?: string;
    userId: string;
}

// API Response Type
export interface ApiResponse<T> {
    data?: T;
    error?: string;
    status: number;
}