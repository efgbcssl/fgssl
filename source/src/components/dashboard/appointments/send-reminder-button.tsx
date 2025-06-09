"use client"

import { Button } from '@/components/ui/button'
import { Clock, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'

export function SendRemindersButton() {
    const [isSending, setIsSending] = useState(false)
    const { toast } = useToast()

    const handleSendReminders = async () => {
        setIsSending(true)
        try {
            const response = await fetch('/api/reminders')
            const data = await response.json()

            if (!response.ok) throw new Error(data.error || 'Failed to send reminders')

            toast({
                title: "Reminders Sent",
                description: `Successfully sent ${data.success} reminders. ${data.failed > 0 ? `${data.failed} failed.` : ''}`,
            })
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "An unknown error occurred",
                variant: "destructive"
            })
        } finally {
            setIsSending(false)
        }
    }

    return (
        <Button onClick={handleSendReminders} disabled={isSending}>
            {isSending ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Clock className="mr-2 h-4 w-4" />
            )}
            Send Reminders
        </Button>
    )
}