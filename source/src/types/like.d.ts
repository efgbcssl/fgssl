export interface Like {
    id: string;
    postId: string;
    commentId?: string | null;
    userId: string;
    createdAt: string;
}