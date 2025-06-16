export interface BlogPost {
    id: string;
    title: string;
    slug: string;
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