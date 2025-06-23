// app/(dashboard)/dashboard/faq/page.tsx
"use client"

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { FAQ } from '@/types/faq'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export default function FAQAdminPage() {
    const [faqs, setFaqs] = useState<FAQ[]>([])
    const [loading, setLoading] = useState(true)
    const [newFAQ, setNewFAQ] = useState({ question: '', answer: '' })
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState({ question: '', answer: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [isUpdating, setIsUpdating] = useState<string | null>(null)

    useEffect(() => {
        fetchFAQs()
    }, [])

    const fetchFAQs = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/faq')
            if (!response.ok) throw new Error('Failed to fetch FAQs')
            const data = await response.json()
            setFaqs(data)
        } catch (error) {
            console.error('Error fetching FAQs:', error)
            toast.error('Failed to load FAQs')
        } finally {
            setLoading(false)
        }
    }

    const handleAddFAQ = async () => {
        if (!newFAQ.question || !newFAQ.answer) {
            toast.error('Please fill in both question and answer')
            return
        }

        setIsSubmitting(true)
        try {
            const response = await fetch('/api/faq', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newFAQ),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to add FAQ')
            }

            const data = await response.json()
            setFaqs([...faqs, data])
            setNewFAQ({ question: '', answer: '' })
            toast.success('FAQ added successfully')
        } catch (error) {
            console.error('Add FAQ error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to add FAQ')
        } finally {
            setIsSubmitting(false)
        }
    }

    const startEditing = (faq: FAQ) => {
        setEditingId(faq.faq_id)
        setEditData({ question: faq.question, answer: faq.answer })
    }

    const handleUpdateFAQ = async (faq_id: string) => {
        if (!editData.question || !editData.answer) {
            toast.error('Please fill in both question and answer')
            return
        }

        setIsUpdating(faq_id)
        try {
            const response = await fetch(`/api/faq/${faq_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editData),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to update FAQ')
            }

            const data = await response.json()
            setFaqs(faqs.map(faq => faq.faq_id === faq_id ? data : faq))
            setEditingId(null)
            toast.success('FAQ updated successfully')
        } catch (error) {
            console.error('Update FAQ error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to update FAQ')
        } finally {
            setIsUpdating(null)
        }
    }

    const handleDeleteFAQ = async (xata_id: string) => {
        setIsDeleting(xata_id)
        try {
            console.log('Sending delete request for FAQ:', xata_id);
            const response = await fetch(`/api/faq/${xata_id}`, {
                method: 'DELETE',
            })

            console.log('Delete response status:', response.status);

            if (!response.ok) {
                const data = await response.json()
                console.log('Delete error response:', data);
                throw new Error(data.error || 'Failed to delete FAQ')
            }
            console.log('Deletion successful, updating UI...');

            setFaqs(faqs.filter(faq => faq.faq_id !== xata_id))
            toast.success('FAQ deleted successfully')
        } catch (error) {
            console.error('Delete FAQ error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to delete FAQ')
            fetchFAQs();
        } finally {
            setIsDeleting(null)
        }
    }

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) return

        const items = Array.from(faqs)
        const [reorderedItem] = items.splice(result.source.index, 1)
        items.splice(result.destination.index, 0, reorderedItem)

        const reorderedFAQs = items.map((item, index) => ({
            ...item,
            order: index
        }))

        setFaqs(reorderedFAQs)

        try {
            const response = await fetch('/api/faq/reorder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reorderedFAQs }),
            })

            if (!response.ok) {
                throw new Error('Failed to save new order')
            }

            toast.success('FAQ order updated successfully')
        } catch (error) {
            console.error('Error reordering FAQs:', error)
            toast.error('Failed to save new order')
            fetchFAQs()
        }
    }

    if (loading) {
        return (
            <div className="container py-8">
                <h1 className="text-2xl font-bold mb-6 text-church-dark">Manage FAQs</h1>
                <p className="text-church-muted">Loading FAQs...</p>
            </div>
        )
    }

    return (
        <div className="container py-8">
            <h1 className="text-2xl font-bold mb-6 text-church-dark">Manage FAQs</h1>

            <div className="mb-8 p-6 bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4 text-church-dark">Add New FAQ</h2>
                <div className="space-y-4">
                    <Input
                        placeholder="Question"
                        value={newFAQ.question}
                        onChange={(e) => setNewFAQ({ ...newFAQ, question: e.target.value })}
                    />
                    <Textarea
                        placeholder="Answer"
                        value={newFAQ.answer}
                        onChange={(e) => setNewFAQ({ ...newFAQ, answer: e.target.value })}
                    />
                    <Button
                        onClick={handleAddFAQ}
                        className="bg-church-primary hover:bg-church-primary/90"
                        disabled={!newFAQ.question || !newFAQ.answer || isSubmitting}
                    >
                        {isSubmitting ? 'Adding...' : 'Add FAQ'}
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow">
                <h2 className="text-xl font-semibold p-6 border-b border-church-muted/20 text-church-dark">
                    Current FAQs
                </h2>

                {faqs.length === 0 ? (
                    <p className="p-6 text-church-muted">No FAQs added yet.</p>
                ) : (
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="faqs">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef}>
                                    {faqs.map((faq, index) => (
                                        <Draggable key={faq.faq_id} draggableId={faq.faq_id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={`p-6 border-b border-church-muted/20 hover:bg-church-light/50 transition-colors ${snapshot.isDragging ? 'bg-church-light/50' : ''
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            {editingId === faq.faq_id ? (
                                                                <div className="space-y-4">
                                                                    <Input
                                                                        value={editData.question}
                                                                        onChange={(e) => setEditData({ ...editData, question: e.target.value })}
                                                                    />
                                                                    <Textarea
                                                                        value={editData.answer}
                                                                        onChange={(e) => setEditData({ ...editData, answer: e.target.value })}
                                                                    />
                                                                    <div className="flex space-x-2">
                                                                        <Button
                                                                            onClick={() => handleUpdateFAQ(faq.faq_id)}
                                                                            className="bg-church-primary hover:bg-church-primary/90"
                                                                            disabled={!editData.question || !editData.answer || isUpdating === faq.faq_id}
                                                                        >
                                                                            {isUpdating === faq.faq_id ? 'Saving...' : 'Save'}
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            onClick={() => setEditingId(null)}
                                                                            className="border-church-primary text-church-primary hover:bg-church-primary hover:text-white"
                                                                            disabled={isUpdating === faq.faq_id}
                                                                        >
                                                                            Cancel
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div>
                                                                    <h3 className="font-medium mb-2 text-church-dark">
                                                                        {faq.question}
                                                                    </h3>
                                                                    <p className="text-church-muted">{faq.answer}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex space-x-2 ml-4">
                                                            {editingId !== faq.faq_id && (
                                                                <>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => startEditing(faq)}
                                                                        className="text-church-primary hover:bg-church-primary/10"
                                                                    >
                                                                        Edit
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="text-red-600 hover:text-red-700 hover:bg-red-100"
                                                                        onClick={() => handleDeleteFAQ(faq.faq_id)}
                                                                        disabled={isDeleting === faq.faq_id}
                                                                    >
                                                                        {isDeleting === faq.faq_id ? 'Deleting...' : 'Delete'}
                                                                    </Button>
                                                                    <div
                                                                        {...provided.dragHandleProps}
                                                                        className="text-church-muted hover:text-church-primary cursor-move px-2"
                                                                    >
                                                                        ≡
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                )}
            </div>
        </div>
    )
}