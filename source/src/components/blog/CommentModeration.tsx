'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Eye, EyeOff, Trash2 } from 'lucide-react'

interface Comment {
    id: string
    name: string
    content: string
    createdAt: string
    replies: Comment[]
    isHidden: boolean
}

interface CommentModerationProps {
    comments: Comment[]
    postSlug: string
}

export function CommentModeration({ comments, postSlug }: CommentModerationProps) {
    const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all')

    const toggleCommentVisibility = async (commentId: string, isHidden: boolean) => {
        try {
            const response = await fetch(`/blog/${postSlug}/comments/${commentId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isHidden: !isHidden }),
            })

            if (response.ok) {
                // Update local state or refetch comments
            }
        } catch (error) {
            console.error('Error toggling comment visibility:', error)
        }
    }

    const deleteComment = async (commentId: string) => {
        try {
            const response = await fetch(`/blog/${postSlug}/comments/${commentId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                // Update local state or refetch comments
            }
        } catch (error) {
            console.error('Error deleting comment:', error)
        }
    }

    const renderComments = (comments: Comment[]) => {
        return comments.map((comment) => (
            <div key={comment.id} className="border rounded-lg p-4 mb-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                        <Avatar>
                            <AvatarImage src={`https://ui-avatars.com/api/?name=${comment.name}`} />
                            <AvatarFallback>{comment.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h4 className="font-medium">{comment.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{comment.content}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                <MessageSquare className="h-3 w-3" />
                                <span>{comment.replies.length} replies</span>
                                <span>•</span>
                                <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCommentVisibility(comment.id, comment.isHidden)}
                        >
                            {comment.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteComment(comment.id)}
                        >
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    </div>
                </div>

                {comment.replies.length > 0 && (
                    <div className="mt-4 ml-12 space-y-4">
                        {comment.replies.map(reply => (
                            <div key={reply.id} className="border-l-2 pl-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={`https://ui-avatars.com/api/?name=${reply.name}`} />
                                            <AvatarFallback>{reply.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h4 className="font-medium text-sm">{reply.name}</h4>
                                            <p className="text-sm text-gray-600 mt-1">{reply.content}</p>
                                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                <span>{formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleCommentVisibility(reply.id, reply.isHidden)}
                                        >
                                            {reply.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteComment(reply.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ))
    }

    return (
        <div>
            <div className="flex border-b mb-6">
                <button
                    className={`px-4 py-2 font-medium ${activeTab === 'all' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('all')}
                >
                    All Comments
                </button>
                <button
                    className={`px-4 py-2 font-medium ${activeTab === 'pending' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Pending Review
                </button>
            </div>

            {activeTab === 'all' ? (
                renderComments(comments)
            ) : (
                renderComments(comments.filter(comment => comment.isHidden))
            )}
        </div>
    )
}