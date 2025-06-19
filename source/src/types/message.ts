export type Message = {
    message_id: string
    name: string
    email: string
    subject?: string | null
    message: string
    status: 'unread' | 'read' | 'archived'
    createdAt: string
    updatedAt?: string
}