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
import { Button } from '@/components/ui/button'
import { MailOpen, Archive, RefreshCw } from 'lucide-react'
import Link from 'next/link'
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
            console.error('Error fetching messages:', error)
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

    const statusColors = {
        unread: 'bg-red-100 text-red-800',
        read: 'bg-blue-100 text-blue-800',
        archived: 'bg-gray-100 text-gray-800'
    }

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
                                <TableRow key={message.message_id} className="hover:bg-gray-50">
                                    <TableCell>
                                        <Link href={`/dashboard/messages/${message.message_id}`} className="block">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[message.status]}`}>
                                                {message.status}
                                            </span>
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/dashboard/messages/${message.message_id}`} className="block">
                                            <div className="font-medium">{message.name}</div>
                                            <div className="text-sm text-gray-500">{message.email}</div>
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/dashboard/messages/${message.message_id}`} className="block">
                                            {message.subject || 'No Subject'}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/dashboard/messages/${message.message_id}`} className="block">
                                            {format(new Date(message.createdAt), 'MMM d, yyyy h:mm a')}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => updateMessageStatus(message.message_id, 'read')}
                                                disabled={message.status === 'read'}
                                            >
                                                <MailOpen className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => updateMessageStatus(message.message_id, 'archived')}
                                                disabled={message.status === 'archived'}
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