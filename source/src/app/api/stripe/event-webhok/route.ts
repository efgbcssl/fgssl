import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { xata } from '@/lib/xata'
import { sendEventRegistrationEmail } from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-05-28.basil'
})
const endpointSecret = process.env.STRIPE_EVENT_WEBHOOK_SECRET!

export async function POST(req: Request) {
    const body = await req.text()
    const sig = (await headers()).get('stripe-signature')

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(body, sig!, endpointSecret)
    } catch (err) {
        console.error('⚠️ Event webhook signature verification failed:', err)
        return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 400 }
        )
    }

    // Handle checkout.session.completed for event payments
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session
        const metadata = session.metadata || {}

        try {
            // Validate required fields
            if (!metadata.eventId || !metadata.registrationId) {
                console.error('Missing required metadata in session:', session.id)
                return NextResponse.json(
                    { error: 'Missing required metadata' },
                    { status: 400 }
                )
            }

            // Get payment details
            const paymentIntent = await stripe.paymentIntents.retrieve(
                session.payment_intent as string
            )
            const amount = paymentIntent.amount / 100
            const currency = paymentIntent.currency.toUpperCase()

            // Get charge details for receipt URL
            const charges = await stripe.charges.list({
                payment_intent: paymentIntent.id,
                limit: 1
            })
            const charge = charges.data[0]

            // Update registration record
            await xata.db.event_registration.update({
                xata_id: metadata.registrationId,
                paymentStatus: 'paid',
                stripePaymentIntentId: paymentIntent.id,
            })

            // Send confirmation email
            try {
                const event = await xata.db.events.read(metadata.eventId)
                const registration = await xata.db.event_registration.read(metadata.registrationId)

                if (registration?.email && event) {
                    await sendEventRegistrationEmail({
                        to: registration.email,
                        eventName: event.title,
                        eventDate: event.date ?? '',
                        eventTime: event.time ?? '',
                        eventLocation: event.location,
                        fullName: registration.name ?? '',
                        additionalDetails: event.description || ''
                    })
                }
            } catch (emailError) {
                console.error('Failed to send event registration email:', emailError)
            }

            console.log(`✅ Successfully processed event payment ${session.id}`)
            return NextResponse.json({ received: true })

        } catch (err) {
            console.error('Error processing event payment:', session.id, err)
            return NextResponse.json(
                { error: 'Failed to process event payment' },
                { status: 500 }
            )
        }
    }

    // Handle other event-related webhook events if needed
    console.log(`ℹ️ Unhandled event type in event webhook: ${event.type}`)
    return NextResponse.json({ received: true })
}