"use client"

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Archive, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

type Message = {
    id: string
    name: string
    email: string
    subject: string
    message: string
    status: 'unread' | 'read' | 'archived'
    createdAt: string
}

export default function MessageDetail() {
    const { id } = useParams()
    const [message, setMessage] = useState<Message | null>(null)
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        const fetchMessage = async () => {
            try {
                const response = await fetch(`/api/messages/${id}`)
                if (!response.ok) throw new Error('Failed to fetch message')
                const data = await response.json()
                setMessage(data)

                // Mark as read when opened
                if (data.status === 'unread') {
                    await fetch(`/api/messages/${id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'read' })
                    })
                }
            } catch (error) {
                console.log('Failed to load messages', error)
                toast({
                    title: "Error",
                    description: "Failed to load message",
                    variant: "destructive"
                })
            } finally {
                setLoading(false)
            }
        }

        fetchMessage()
    }, [id, toast])

    const updateStatus = async (status: string) => {
        try {
            const response = await fetch(`/api/messages/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            })

            if (!response.ok) throw new Error('Failed to update message')

            setMessage(prev => prev ? { ...prev, status: status as Message['status'] } : null)
            toast({
                title: "Updated",
                description: "Message status updated",
            })
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Update failed",
                variant: "destructive"
            })
        }
    }

    if (loading) return <div className="container py-8">Loading...</div>
    if (!message) return <div className="container py-8">Message not found</div>

    return (
        <div className="container py-8">
            <div className="flex justify-between items-center mb-6">
                <Button variant="outline" asChild>
                    <a href="/dashboard/messages">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Messages
                    </a>
                </Button>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => updateStatus('archived')}
                    >
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">{message.subject || 'No Subject'}</h1>
                        <div className="text-sm text-gray-500 mt-1">
                            {format(new Date(message.createdAt), 'MMMM d, yyyy h:mm a')}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{message.status}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <h2 className="text-sm font-medium text-gray-500">From</h2>
                        <p>{message.name} &lt;{message.email}&gt;</p>
                    </div>

                    <div>
                        <h2 className="text-sm font-medium text-gray-500">Message</h2>
                        <div className="mt-1 whitespace-pre-line">{message.message}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}