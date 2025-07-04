// components/event-registration.tsx
"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { loadStripe } from '@stripe/stripe-js'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '@/components/ui/select'
import { RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

type FormFieldOption = {
    id: string
    label: string
}

type FormField = {
    id: string
    label: string
    type: string
    required?: boolean
    options?: FormFieldOption[]
}

type Event = {
    id: string
    isPaidEvent: boolean
    stripePriceId?: string
    currency?: string
    price?: number
    formSchema?: {
        fields?: FormField[]
    }
    // add other properties as needed
}

export function EventRegistration({ event }: { event: Event }) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            if (event.isPaidEvent) {
                // Create Stripe checkout session
                const response = await fetch('/api/stripe/create-checkout-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        eventId: event.id,
                        name,
                        email,
                        priceId: event.stripePriceId,
                        successUrl: `${window.location.origin}/events/${event.id}/success`,
                        cancelUrl: `${window.location.origin}/events/${event.id}`
                    })
                })

                const { sessionId } = await response.json()
                const stripe = await stripePromise
                await stripe?.redirectToCheckout({ sessionId })
            } else {
                // Just register the attendee
                await fetch('/api/events/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        eventId: event.id,
                        name,
                        email
                    })
                })

                toast({
                    title: 'Success',
                    description: 'You have successfully registered for this event!'
                })
            }
        } catch (error) {
            console.error(error)
            toast({
                title: 'Error',
                description: 'Failed to register for the event',
                variant: 'destructive'
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="border rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold">Register for this event</h3>

            {event.isPaidEvent && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <p className="text-yellow-700">
                        This is a paid event. You&apos;ll be redirected to complete payment after registration.
                    </p>
                    <p className="font-medium mt-2">
                        Price: {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: event.currency
                        }).format(event.price ?? 0)}
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                {/* Render custom form fields if they exist */}
                {event.formSchema?.fields?.map((field) => (
                    <div key={field.id}>
                        <label className="block text-sm font-medium mb-1">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {renderFormField(field)}
                    </div>
                ))}

                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Processing...' : event.isPaidEvent ? 'Continue to Payment' : 'Register'}
                </Button>
            </form>
        </div>
    )
}

function renderFormField(field: FormField) {
    switch (field.type) {
        case 'textarea':
            return <Textarea required={field.required} />
        case 'select':
            return (
                <Select required={field.required}>
                    <SelectTrigger>
                        <SelectValue placeholder={`Select ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                        {field.options?.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )
        case 'radio':
            return (
                <div className="space-y-2">
                    {field.options?.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.id} id={option.id} />
                            <Label htmlFor={option.id}>{option.label}</Label>
                        </div>
                    ))}
                </div>
            )
        case 'checkbox':
            return (
                <div className="space-y-2">
                    {field.options?.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                            <Checkbox id={option.id} />
                            <Label htmlFor={option.id}>{option.label}</Label>
                        </div>
                    ))}
                </div>
            )
        default:
            return <Input type={field.type} required={field.required} />
    }
}