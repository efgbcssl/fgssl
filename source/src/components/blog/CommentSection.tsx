"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

type Comment = {
  id: number
  name: string
  date: string
  content: string
  replies?: Comment[]
}

// Sample comments data
const initialComments: Comment[] = [
  {
    id: 1,
    name: "James Wilson",
    date: "June 3, 2023",
    content: "This was such an insightful article. I've been struggling with anxiety lately and these spiritual practices are exactly what I needed to hear about. Thank you!",
    replies: [
      {
        id: 3,
        name: "Pastor John Smith",
        date: "June 4, 2023",
        content: "Thank you for your kind words, James. I'm so glad the article was helpful. We'll be diving deeper into spiritual practices for anxiety in our upcoming Wednesday night Bible study as well."
      }
    ]
  },
  {
    id: 2,
    name: "Mary Thompson",
    date: "June 2, 2023",
    content: "I especially appreciated the section about making time for daily prayer. It's such a simple practice but it makes such a difference in my day when I prioritize it.",
  }
]

export default function CommentSection() {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [newComment, setNewComment] = useState({
    name: '',
    email: '',
    content: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call to post comment
    setTimeout(() => {
      const newCommentObj: Comment = {
        id: Date.now(),
        name: newComment.name,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        content: newComment.content,
      }
      
      setComments([...comments, newCommentObj])
      setNewComment({ name: '', email: '', content: '' })
      setIsSubmitting(false)
      
      toast({
        title: "Comment Posted",
        description: "Your comment has been successfully posted.",
      })
    }, 1000)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewComment({ ...newComment, [name]: value })
  }

  return (
    <div>
      <h3 className="text-2xl font-bold mb-6 font-heading">Comments ({comments.length})</h3>
      
      {/* Comment List */}
      <div className="space-y-8 mb-10">
        {comments.map((comment) => (
          <div key={comment.id} className="border-b border-gray-200 pb-6 last:pb-0 last:border-b-0">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold text-lg">{comment.name}</h4>
                <p className="text-gray-500 text-sm">{comment.date}</p>
              </div>
            </div>
            <p className="text-gray-700 mb-4">{comment.content}</p>
            
            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="pl-6 border-l-2 border-gray-200 mt-6 space-y-6">
                {comment.replies.map((reply) => (
                  <div key={reply.id}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-bold">{reply.name}</h5>
                        <p className="text-gray-500 text-sm">{reply.date}</p>
                      </div>
                    </div>
                    <p className="text-gray-700">{reply.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Comment Form */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4 font-heading">Leave a Comment</h3>
        <form onSubmit={handleCommentSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name*
              </label>
              <Input 
                id="name" 
                name="name" 
                value={newComment.name}
                onChange={handleInputChange}
                required 
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email* (will not be published)
              </label>
              <Input 
                id="email" 
                name="email"
                type="email"
                value={newComment.email}
                onChange={handleInputChange}
                required 
              />
            </div>
          </div>
          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-1">
              Comment*
            </label>
            <Textarea 
              id="content" 
              name="content"
              rows={5}
              value={newComment.content}
              onChange={handleInputChange}
              required 
            />
          </div>
          <Button 
            type="submit"
            className="bg-church-primary text-white hover:bg-church-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Posting Comment..." : "Post Comment"}
          </Button>
        </form>
      </div>
    </div>
  )
}