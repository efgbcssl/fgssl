/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect, useCallback } from 'react'
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

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/events')
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json()
            setEvents(data);
        } catch (error) {
            console.log('Fetch error: ', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch events',
                variant: 'destructive'
            })
        } finally {
            setIsLoading(false)
        }
    }, [toast])

    useEffect(() => {
        fetchEvents()
    }, [fetchEvents])

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
        if (!editingEvent) return;

        // Enhanced validation
        const errors = [];
        if (!editingEvent.title) errors.push('Title is required');
        if (!editingEvent.date) errors.push('Date is required');
        if (!editingEvent.imageSrc) errors.push('Image URL is required');

        if (errors.length > 0) {
            toast({
                title: 'Validation Error',
                description: errors.join('\n'),
                variant: 'destructive'
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // Prepare clean data
            const { id, ...payload } = editingEvent;
            const url = isNewEvent ? '/api/events' : `/api/events/${id}`;
            const method = isNewEvent ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...payload,
                    expiresAt: payload.expiresAt || new Date(
                        new Date(payload.date).getTime() + 15 * 24 * 60 * 60 * 1000
                    ).toISOString()
                })
            });

            if (!response.ok) throw new Error(await response.text());

            toast({
                title: 'Success',
                description: `Event ${isNewEvent ? 'created' : 'updated'} successfully`
            });

            setEditingEvent(null);
            setIsNewEvent(false);
            await fetchEvents();
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Operation failed',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDragEnd = async (result: import('@hello-pangea/dnd').DropResult) => {
        if (!result.destination || result.source.index === result.destination.index) return

        const newEvents = reorder(
            events,
            result.source.index,
            result.destination.index
        ).map((event, index) => ({ ...event, order: index }));

        setEvents(newEvents);

        try {
            const response = await fetch('/api/events/reorder', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEvents)
            });
            if (!response.ok) throw new Error('Reorder failed');
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save new order',
                variant: 'destructive'
            });
            fetchEvents(); // Revert to server state
        }
    }

    // Helper function
    const reorder = <T,>(list: T[], startIndex: number, endIndex: number): T[] => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
    };

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