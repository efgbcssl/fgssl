"use client"

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Archive, ArrowLeft, Mail, Clock } from 'lucide-react'
import { format } from 'date-fns'

type Message = {
    message_id: string
    name: string
    email: string
    subject: string
    message: string
    status: 'unread' | 'read' | 'archived'
    createdAt: string
}

export default function MessageDetail() {
    const { id: message_id } = useParams()
    const [message, setMessage] = useState<Message | null>(null)
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()
    const router = useRouter()

    useEffect(() => {
        const fetchMessage = async () => {
            try {
                const response = await fetch(`/api/messages/${message_id}`)
                if (!response.ok) throw new Error('Failed to fetch message')
                const data = await response.json()

                if (!data) {
                    throw new Error('Message not found')
                }

                setMessage(data)

                // Mark as read when opened if unread
                if (data.status === 'unread') {
                    await fetch(`/api/messages/${message_id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'read' })
                    })
                }
            } catch (error) {
                console.error('Failed to load message:', error)
                toast({
                    title: "Error",
                    description: error instanceof Error ? error.message : "Failed to load message",
                    variant: "destructive"
                })
                router.push('/dashboard/messages')
            } finally {
                setLoading(false)
            }
        }

        fetchMessage()
    }, [message_id, toast, router])

    const updateStatus = async (status: string) => {
        try {
            const response = await fetch(`/api/messages/${message_id}`, {
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

    if (loading) return (
        <div className="container py-8">
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        </div>
    )

    if (!message) return (
        <div className="container py-8">
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold">Message not found</h2>
                <p className="mt-2 text-gray-600">The requested message could not be loaded.</p>
                <Button className="mt-4" onClick={() => router.push('/dashboard/messages')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Messages
                </Button>
            </div>
        </div>
    )

    return (
        <div className="container py-8">
            <div className="flex justify-between items-center mb-6">
                <Button variant="outline" onClick={() => router.push('/dashboard/messages')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Messages
                </Button>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => updateStatus('archived')}
                        disabled={message.status === 'archived'}
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
                            <Clock className="inline mr-1 h-4 w-4" />
                            {format(new Date(message.createdAt), 'MMMM d, yyyy h:mm a')}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${message.status === 'unread' ? 'bg-red-100 text-red-800' :
                                message.status === 'read' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                            }`}>
                            {message.status}
                        </span>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h2 className="text-sm font-medium text-gray-500 mb-2">From</h2>
                        <div className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-gray-400" />
                            <p>{message.name} &lt;{message.email}&gt;</p>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                        <h2 className="text-sm font-medium text-gray-500 mb-2">Message</h2>
                        <div className="mt-2 whitespace-pre-line text-gray-700">
                            {message.message}
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <Button asChild>
                        <a href={`mailto:${message.email}?subject=Re: ${message.subject || 'Your message'}`}>
                            <Mail className="mr-2 h-4 w-4" />
                            Reply via Email
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    )
}