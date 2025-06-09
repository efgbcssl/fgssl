"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Edit, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

type Event = {
    id: string
    title: string
    description?: string
    date: string
    time: string
    location: string
    imageSrc: string
    ctaText: string
    ctaLink: string
    order: number
    expiresAt: string
}

export function EventManager() {
    const [events, setEvents] = useState<Event[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [editingEvent, setEditingEvent] = useState<Event | null>(null)
    const [isNewEvent, setIsNewEvent] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast()

    useEffect(() => {
        fetchEvents()
    }, [])

    const fetchEvents = async () => {
        try {
            const response = await fetch('/api/events')
            const data = await response.json()
            setEvents(data)
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to fetch events',
                variant: 'destructive'
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/events/${id}`, {
                method: 'DELETE'
            })
            toast({
                title: 'Success',
                description: 'Event deleted successfully'
            })
            fetchEvents()
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to delete event',
                variant: 'destructive'
            })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {

        e.preventDefault();



        // Validate required fields
        if (!editingEvent?.title || !editingEvent?.date) {
            toast({
                title: 'Error',
                description: 'Title and date are required',
                variant: 'destructive'
            });
            return;
        }

        const method = isNewEvent ? 'POST' : 'PUT';
        const url = isNewEvent ? '/api/events' : `/api/events/${editingEvent.id}`;

        if (isSubmitting) return; // Prevent multiple submissions
        setIsSubmitting(true);

        try {
            // Prepare clean data without internal fields
            const { id, xata_id, xata_createdat, xata_updatedat, xata_version, ...cleanData } = editingEvent;

            // Calculate expiresAt if not set
            if (!cleanData.expiresAt) {
                const eventDate = new Date(cleanData.date);
                cleanData.expiresAt = new Date(eventDate.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString();
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cleanData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save event');
            }

            const result = await response.json();

            toast({
                title: 'Success',
                description: isNewEvent
                    ? 'Event created successfully'
                    : 'Event updated successfully'
            });

            setEditingEvent(null);
            setIsNewEvent(false);
            fetchEvents();

        } catch (error) {
            console.error('Error saving event:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to save event',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDragEnd = async (result: import('@hello-pangea/dnd').DropResult) => {
        if (!result.destination) return

        const items = Array.from(events)
        const [reorderedItem] = items.splice(result.source.index, 1)
        items.splice(result.destination.index, 0, reorderedItem)

        // Update the order property based on new position
        const updatedEvents = items.map((event, index) => ({
            ...event,
            order: index
        }))

        setEvents(updatedEvents)

        // Save the new order to the database
        try {
            await fetch('/api/events/reorder', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedEvents)
            })
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to update event order',
                variant: 'destructive'
            })
            // Revert if failed
            fetchEvents()
        }
    }

    if (isLoading) return <div>Loading...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Manage Events</h2>
                <Button onClick={() => {
                    setEditingEvent({
                        id: '',
                        title: '',
                        description: '',
                        date: '',
                        time: '',
                        location: '',
                        imageSrc: '',
                        ctaText: 'Learn More',
                        ctaLink: '#',
                        order: events.length,
                        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
                    })
                    setIsNewEvent(true)
                }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Event
                </Button>
            </div>

            {editingEvent && (
                <div className="bg-card p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">
                        {isNewEvent ? 'Create New Event' : 'Edit Event'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Title</label>
                            <Input
                                value={editingEvent.title}
                                onChange={(e) => setEditingEvent({
                                    ...editingEvent,
                                    title: e.target.value
                                })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <Textarea
                                value={editingEvent.description || ''}
                                onChange={(e) => setEditingEvent({
                                    ...editingEvent,
                                    description: e.target.value
                                })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Date</label>
                                <Input
                                    type="date"
                                    value={editingEvent.date}
                                    onChange={(e) => setEditingEvent({
                                        ...editingEvent,
                                        date: e.target.value
                                    })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Time</label>
                                <Input
                                    type="time"
                                    value={editingEvent.time}
                                    onChange={(e) => setEditingEvent({
                                        ...editingEvent,
                                        time: e.target.value
                                    })}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Location</label>
                            <Input
                                value={editingEvent.location}
                                onChange={(e) => setEditingEvent({
                                    ...editingEvent,
                                    location: e.target.value
                                })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Image URL</label>
                            <Input
                                value={editingEvent.imageSrc}
                                onChange={(e) => setEditingEvent({
                                    ...editingEvent,
                                    imageSrc: e.target.value
                                })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Button Text</label>
                                <Input
                                    value={editingEvent.ctaText}
                                    onChange={(e) => setEditingEvent({
                                        ...editingEvent,
                                        ctaText: e.target.value
                                    })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Button Link</label>
                                <Input
                                    value={editingEvent.ctaLink}
                                    onChange={(e) => setEditingEvent({
                                        ...editingEvent,
                                        ctaLink: e.target.value
                                    })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setEditingEvent(null)
                                    setIsNewEvent(false)
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : isNewEvent ? 'Create Event' : 'Update Event'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="events">
                    {(provided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-2"
                        >
                            {events.map((event, index) => (
                                <Draggable key={event.id} draggableId={event.id} index={index}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className="bg-card p-4 rounded-lg shadow flex items-center justify-between"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div
                                                    {...provided.dragHandleProps}
                                                    className="cursor-move"
                                                >
                                                    <svg
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <line x1="3" y1="12" x2="21" y2="12"></line>
                                                        <line x1="3" y1="6" x2="21" y2="6"></line>
                                                        <line x1="3" y1="18" x2="21" y2="18"></line>
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h3 className="font-medium">{event.title}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {event.date} • {event.time}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setEditingEvent(event)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(event.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
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

            {events.length === 0 && !editingEvent && (
                <div className="text-center py-8">
                    <p className="text-muted-foreground">
                        No events found. Create your first event banner.
                    </p>
                </div>
            )}
        </div>
    )
}