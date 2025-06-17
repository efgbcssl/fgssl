export interface BlogComment {
    id: string;
    postId: string;
    parentId: string | null;
    name: string;
    content: string;
    createdAt: string;
    isHidden: boolean;
    likes: number;
}