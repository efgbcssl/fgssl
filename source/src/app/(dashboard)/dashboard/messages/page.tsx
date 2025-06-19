"use client"

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MailOpen, Archive, RefreshCw } from 'lucide-react'
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

export default function MessagesDashboard() {
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    const fetchMessages = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/messages')
            if (!response.ok) throw new Error('Failed to fetch messages')
            const data = await response.json()
            setMessages(data)
        } catch (error) {
            console.error('Error fetching messages!: ', error)
            toast({
                title: "Error",
                description: "Failed to load messages",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const updateMessageStatus = async (message_id: string, status: string) => {
        try {
            const response = await fetch(`/api/messages/${message_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            })

            if (!response.ok) throw new Error('Failed to update message')

            fetchMessages()
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

    useEffect(() => {
        fetchMessages()
    }, [])

    return (
        <div className="container py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Messages</h1>
                <Button variant="outline" onClick={fetchMessages}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>From</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : messages.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">
                                    No messages found
                                </TableCell>
                            </TableRow>
                        ) : (
                            messages.map((message) => (
                                <TableRow key={message.message_id}>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                message.status === 'unread' ? 'destructive' :
                                                    message.status === 'read' ? 'default' : 'secondary'
                                            }
                                        >
                                            {message.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{message.name}</div>
                                        <div className="text-sm text-gray-500">{message.email}</div>
                                    </TableCell>
                                    <TableCell>{message.subject || 'No Subject'}</TableCell>
                                    <TableCell>
                                        {format(new Date(message.createdAt), 'MMM d, yyyy h:mm a')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => updateMessageStatus(message.message_id, 'read')}
                                            >
                                                <MailOpen className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => updateMessageStatus(message.message_id, 'archived')}
                                            >
                                                <Archive className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}