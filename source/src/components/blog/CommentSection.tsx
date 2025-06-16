'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { Share2, MessageSquare, ThumbsUp } from 'lucide-react'

interface Comment {
  id: string
  name: string
  content: string
  createdAt: string
  replies: Comment[]
  isHidden?: boolean
  likes: number
  liked?: boolean
}

interface CommentSectionProps {
  postId: string
  userId: string
  initialComments: Comment[]
}

export function CommentSection({ postId, userId, initialComments }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [showShare, setShowShare] = useState(false)

  // Fetch like status for comments
  useEffect(() => {
    const fetchLikeStatus = async () => {
      try {
        const updatedComments = await Promise.all(
          comments.map(async (comment) => {
            const response = await fetch(`/api/likes?postId=${postId}&commentId=${comment.id}&userId=${userId}`)
            const { liked } = await response.json()

            const repliesWithLikes = await Promise.all(
              comment.replies.map(async (reply) => {
                const replyResponse = await fetch(`/api/likes?postId=${postId}&commentId=${reply.id}&userId=${userId}`)
                const { liked: replyLiked } = await replyResponse.json()
                return { ...reply, liked: replyLiked }
              })
            )

            return { ...comment, liked, replies: repliesWithLikes }
          })
        )
        setComments(updatedComments)
      } catch (error) {
        console.error('Error fetching like status:', error)
      }
    }

    if (userId) {
      fetchLikeStatus()
    }
  }, [postId, userId, comments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !content.trim()) return

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId, name, content }),
      })

      if (response.ok) {
        const newComment = await response.json()
        setComments([...comments, newComment])
        setName('')
        setContent('')
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
    }
  }

  const handleReplySubmit = async (commentId: string) => {
    if (!replyContent.trim()) return

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          parentId: commentId,
          name,
          content: replyContent
        }),
      })

      if (response.ok) {
        const newReply = await response.json()
        setComments(comments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              replies: [...comment.replies, newReply]
            }
          }
          return comment
        }))
        setReplyContent('')
        setReplyingTo(null)
      }
    } catch (error) {
      console.error('Error submitting reply:', error)
    }
  }

  const toggleLike = async (commentId: string) => {
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          commentId,
          userId
        }),
      })

      if (response.ok) {
        const { liked } = await response.json()

        setComments(comments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              likes: liked ? comment.likes + 1 : comment.likes - 1,
              liked
            }
          }

          // Update replies as well
          const updatedReplies = comment.replies.map(reply => {
            if (reply.id === commentId) {
              return {
                ...reply,
                likes: liked ? reply.likes + 1 : reply.likes - 1,
                liked
              }
            }
            return reply
          })

          return {
            ...comment,
            replies: updatedReplies
          }
        }))
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const renderComments = (comments: Comment[], depth = 0) => {
    return comments.map((comment) => (
      <div
        key={comment.id}
        className={`mt-4 ${depth > 0 ? 'ml-8 border-l-2 pl-4 border-gray-200' : ''}`}
      >
        <div className={`flex gap-3 ${comment.isHidden ? 'opacity-50' : ''}`}>
          <Avatar>
            <AvatarImage src={`https://ui-avatars.com/api/?name=${comment.name}`} />
            <AvatarFallback>{comment.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <h4 className="font-medium">{comment.name}</h4>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="mt-1 text-sm">{comment.content}</p>
            </div>
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <button
                onClick={() => toggleLike(comment.id)}
                className={`flex items-center gap-1 ${comment.liked ? 'text-blue-500' : 'hover:text-blue-500'}`}
              >
                <ThumbsUp className="h-3 w-3" /> {comment.likes} Like{comment.likes !== 1 ? 's' : ''}
              </button>
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="flex items-center gap-1 hover:text-blue-500"
              >
                <MessageSquare className="h-3 w-3" /> Reply
              </button>
            </div>

            {replyingTo === comment.id && (
              <div className="mt-3">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your reply..."
                  rows={2}
                  className="text-sm"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleReplySubmit(comment.id)}
                  >
                    Post Reply
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        {comment.replies && renderComments(comment.replies, depth + 1)}
      </div>
    ))
  }

  return (
    <div className="mt-12">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Comments ({comments.length})</h3>
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShare(!showShare)}
          >
            <Share2 className="h-4 w-4 mr-2" /> Share
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
          />
          <Input
            type="email"
            placeholder="Your email (optional)"
          />
        </div>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your comment..."
          rows={4}
          required
        />
        <div className="flex justify-end">
          <Button type="submit">Post Comment</Button>
        </div>
      </form>

      <div className="mt-8">
        {comments.length > 0 ? (
          renderComments(comments)
        ) : (
          <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  )
}