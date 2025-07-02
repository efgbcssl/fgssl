/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Edit, Plus, Move, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { FormField, FormSchema } from './form-builder/types'
import { FormBuilder } from '@/components/dashboard/form-builder/form-builder'
import { PriceInput } from '@/components/ui/price-input'

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
    requiresRSVP: boolean
    isPaidEvent: boolean
    price: number
    currency: string
    stripePriceId?: string
    capacity?: number
    formSchema?: FormSchema
}

export function EventManager() {
    const [events, setEvents] = useState<Event[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [editingEvent, setEditingEvent] = useState<Event | null>(null)
    const [isNewEvent, setIsNewEvent] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'form' | 'pricing'>('details')
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
        if (editingEvent.requiresRSVP && !editingEvent.capacity) errors.push('Capacity is required for RSVP events');
        if (editingEvent.isPaidEvent && editingEvent.price <= 0) errors.push('Price must be greater than 0 for paid events');

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

            // Create/update Stripe price if it's a paid event
            if (payload.isPaidEvent) {
                const priceResponse = await fetch('/api/stripe/create-price', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        eventId: id,
                        price: payload.price * 100, // Convert to cents
                        currency: payload.currency,
                        productName: payload.title
                    })
                });

                if (!priceResponse.ok) throw new Error('Failed to create Stripe price');
                const priceData = await priceResponse.json();
                payload.stripePriceId = priceData.priceId;
            }

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

    const reorder = <T,>(list: T[], startIndex: number, endIndex: number): T[] => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
    };

    const updateFormSchema = (schema: FormSchema) => {
        if (editingEvent) {
            setEditingEvent({
                ...editingEvent,
                formSchema: schema
            });
        }
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
                        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                        requiresRSVP: false,
                        isPaidEvent: false,
                        price: 0,
                        currency: 'USD',
                        capacity: 0
                    })
                    setIsNewEvent(true)
                    setActiveTab('details')
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

                    <div className="flex border-b mb-6">
                        <button
                            className={`px-4 py-2 font-medium ${activeTab === 'details' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                            onClick={() => setActiveTab('details')}
                        >
                            Event Details
                        </button>
                        <button
                            className={`px-4 py-2 font-medium ${activeTab === 'form' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                            onClick={() => setActiveTab('form')}
                            disabled={!editingEvent.requiresRSVP}
                        >
                            Registration Form
                        </button>
                        <button
                            className={`px-4 py-2 font-medium ${activeTab === 'pricing' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                            onClick={() => setActiveTab('pricing')}
                            disabled={!editingEvent.isPaidEvent}
                        >
                            Pricing
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {activeTab === 'details' && (
                            <>
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

                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="requires-rsvp"
                                            checked={editingEvent.requiresRSVP}
                                            onCheckedChange={(checked) => {
                                                setEditingEvent({
                                                    ...editingEvent,
                                                    requiresRSVP: checked,
                                                    // Reset form schema if disabling RSVP
                                                    formSchema: checked ? editingEvent.formSchema : undefined
                                                });
                                                if (!checked) {
                                                    setEditingEvent(prev => ({
                                                        ...prev!,
                                                        isPaidEvent: false
                                                    }));
                                                }
                                            }}
                                        />
                                        <Label htmlFor="requires-rsvp">Requires Registration/RSVP</Label>
                                    </div>

                                    {editingEvent.requiresRSVP && (
                                        <div className="space-y-4 pl-8">
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id="is-paid-event"
                                                    checked={editingEvent.isPaidEvent}
                                                    onCheckedChange={(checked) => setEditingEvent({
                                                        ...editingEvent,
                                                        isPaidEvent: checked,
                                                        price: checked ? editingEvent.price || 10 : 0
                                                    })}
                                                />
                                                <Label htmlFor="is-paid-event">Paid Event</Label>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-1">Capacity</label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={editingEvent.capacity || ''}
                                                    onChange={(e) => setEditingEvent({
                                                        ...editingEvent,
                                                        capacity: parseInt(e.target.value) || 0
                                                    })}
                                                    required={editingEvent.requiresRSVP}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {activeTab === 'form' && editingEvent.requiresRSVP && (
                            <div className="space-y-4">
                                <h4 className="font-medium">Registration Form Builder</h4>
                                <p className="text-sm text-muted-foreground">
                                    Build the form attendees will fill out when registering for this event.
                                </p>

                                <FormBuilder
                                    schema={editingEvent.formSchema || { fields: [] }}
                                    onChange={updateFormSchema}
                                />

                                <div className="text-sm text-muted-foreground pt-2">
                                    <p>Name and email fields are always included and don't need to be added here.</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'pricing' && editingEvent.isPaidEvent && (
                            <div className="space-y-4">
                                <h4 className="font-medium">Pricing Details</h4>

                                <PriceInput
                                    price={editingEvent.price}
                                    currency={editingEvent.currency}
                                    onChange={(price, currency) => setEditingEvent({
                                        ...editingEvent,
                                        price,
                                        currency
                                    })}
                                />

                                <div className="text-sm text-muted-foreground pt-2">
                                    <p>Payments will be processed through Stripe. Make sure you have configured your Stripe account.</p>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between pt-6">
                            <div>
                                {activeTab === 'form' && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setActiveTab('details')}
                                    >
                                        Back to Details
                                    </Button>
                                )}
                                {activeTab === 'pricing' && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setActiveTab(editingEvent.requiresRSVP ? 'form' : 'details')}
                                    >
                                        Back
                                    </Button>
                                )}
                            </div>

                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setEditingEvent(null)
                                        setIsNewEvent(false)
                                    }}
                                >
                                    Cancel
                                </Button>

                                {activeTab === 'details' && editingEvent.requiresRSVP && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setActiveTab('form')}
                                    >
                                        Next: Registration Form
                                    </Button>
                                )}

                                {activeTab === 'form' && editingEvent.isPaidEvent && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setActiveTab('pricing')}
                                    >
                                        Next: Pricing
                                    </Button>
                                )}

                                {(activeTab === 'details' && !editingEvent.requiresRSVP) ||
                                    (activeTab === 'form' && !editingEvent.isPaidEvent) ||
                                    activeTab === 'pricing' ? (
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? 'Saving...' : isNewEvent ? 'Create Event' : 'Update Event'}
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            if (activeTab === 'details' && editingEvent.requiresRSVP) {
                                                setActiveTab('form')
                                            } else if (activeTab === 'form' && editingEvent.isPaidEvent) {
                                                setActiveTab('pricing')
                                            }
                                        }}
                                    >
                                        Next
                                    </Button>
                                )}
                            </div>
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
                                                    <Move className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="font-medium">{event.title}</h3>
                                                        {event.requiresRSVP && (
                                                            <Badge variant="secondary">
                                                                {event.isPaidEvent ? 'Paid' : 'RSVP'}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {event.date} • {event.time}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditingEvent(event)
                                                        setActiveTab('details')
                                                    }}
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