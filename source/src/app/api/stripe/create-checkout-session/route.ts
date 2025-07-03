// app/api/stripe/create-checkout-session/route.ts
import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { XataClient } from '@/xata'

const stripe = new Stripe(process.env.STRIPE_EVENT_WEBHOOK_SECRET!, {
    apiVersion: '2025-05-28.basil'
})

const xata = new XataClient()

export async function POST(req: Request) {
    const { eventId, name, email, priceId, successUrl, cancelUrl } = await req.json()

    try {
        // Create a registration record first
        const registration = await xata.db.event_registration.create({
            event: eventId,
            name,
            email,
            paymentStatus: 'pending'
        })

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1
            }],
            mode: 'payment',
            success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl,
            metadata: {
                eventId,
                registrationId: registration.xata_id
            },
            customer_email: email
        })

        return NextResponse.json({ sessionId: session.id })
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        )
    }
}