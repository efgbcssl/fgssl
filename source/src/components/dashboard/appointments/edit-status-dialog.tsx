"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Appointment } from '@/types/appointments'

export function EditStatusDialog({
    appointment,
    onStatusChange
}: {
    appointment: Appointment
    onStatusChange?: (newStatus: string) => void
}) {
    const [open, setOpen] = useState(false)
    const [status, setStatus] = useState<string>(appointment.status)
    const [remark, setRemark] = useState(appointment.remark || '')
    const [isSaving, setIsSaving] = useState(false)
    const { toast } = useToast()

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const response = await fetch(`/api/appointments/${appointment.phoneNumber}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status, remark })
            })

            if (!response.ok) throw new Error('Failed to update')

            // ✅ Call parent update function
            onStatusChange?.(status)

            toast({
                title: 'Success',
                description: 'Appointment updated successfully'
            })

            setOpen(false)
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'An error occurred',
                variant: 'destructive'
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">Edit</Button>
            </DialogTrigger>
            <DialogContent className="bg-white rounded-lg p-6 max-w-md">
                <DialogHeader>
                    <DialogTitle>Update Appointment</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 bg-white/80 backdrop-blur-md p-4 rounded-lg">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="bg-white/90 backdrop-blur border border-gray-300">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white/90 backdrop-blur-md shadow-lg rounded-md">
                            <SelectItem
                                value="pending"
                                className="flex items-center gap-2 hover:bg-yellow-100 focus:bg-yellow-200 data-[state=checked]:bg-yellow-300 font-medium px-3 py-2 rounded"
                            >
                                Pending
                            </SelectItem>
                            <SelectItem
                                value="completed"
                                className="flex items-center gap-2 hover:bg-green-100 focus:bg-green-200 data-[state=checked]:bg-green-300 font-medium px-3 py-2 rounded"
                            >
                                Completed
                            </SelectItem>
                            <SelectItem
                                value="cancelled"
                                className="flex items-center gap-2 hover:bg-red-100 focus:bg-red-200 data-[state=checked]:bg-red-300 font-medium px-3 py-2 rounded"
                            >
                                Cancelled
                            </SelectItem>

                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Remarks</Label>
                    <Textarea
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        placeholder="Enter any notes about this appointment"
                    />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog >
    )
}
