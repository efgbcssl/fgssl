import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-05-28.basil'
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, email, phone, amount, donationType } = body

        // 1. Create or get customer
        const customer = await stripe.customers.create({ email, name, phone })

        // 2. Create a price dynamically for this donation amount
        const product = await stripe.products.create({
            name: `Recurring Donation - ${donationType}`,
        })

        const price = await stripe.prices.create({
            unit_amount: amount,
            currency: 'usd',
            recurring: { interval: 'month' },
            product: product.id,
        })

        // 3. Create subscription
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: price.id }],
            payment_behavior: 'default_incomplete',
            payment_settings: {
                save_default_payment_method: 'on_subscription',
                payment_method_types: ['card']
            },
            expand: ['latest_invoice.payment_intent'],
            metadata: {
                donorName: name,
                donorEmail: email,
                donationType
            }
        })

        // Type guard to check if latest_invoice is an Invoice object
        const latestInvoice = subscription.latest_invoice
        let clientSecret: string | null = null

        if (latestInvoice && typeof latestInvoice === 'object' && 'payment_intent' in latestInvoice) {
            const paymentIntent = latestInvoice.payment_intent
            if (paymentIntent && typeof paymentIntent === 'object' && 'client_secret' in paymentIntent) {
                clientSecret = paymentIntent.client_secret as string
            }
        }
        return NextResponse.json({
            clientSecret,
            subscriptionId: subscription.id
        })
    } catch (err: unknown) {
        console.error('Subscription error:', err)
        return new NextResponse(JSON.stringify({ message: (err instanceof Error ? err.message : 'Internal error') }), { status: 500 })
    }
}
