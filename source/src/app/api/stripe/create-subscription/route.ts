import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-05-28.basil'
})

export async function POST(req: Request) {
    try {
        console.log('📩 Received POST request for subscription')

        const body = await req.json()
        const { name, email, phone, amount, donationType, frequency } = body

        console.log('✅ Parsed request body:', { name, email, phone, amount, donationType, frequency })

        // 1. Validate input
        if (!name || !email || !amount || !donationType || !frequency) {
            console.warn('⚠️ Missing required fields')
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            )
        }

        // 2. Create customer
        console.log('👤 Creating customer in Stripe...')
        const customer = await stripe.customers.create({
            email,
            name,
            phone,
            metadata: { donationType, frequency }
        })
        console.log('✅ Customer created:', customer.id)

        // 3. Determine interval
        console.log('⏱ Determining billing interval...')
        const interval = (() => {
            switch (frequency) {
                case 'daily': return 'day'
                case 'weekly': return 'week'
                case 'monthly': return 'month'
                case 'yearly': return 'year'
                default: return 'month'
            }
        })()
        console.log(`✅ Billing interval set to: ${interval}`)

        // 4. Create product and price
        console.log('🛒 Creating product...')
        const product = await stripe.products.create({
            name: `${donationType} (${frequency})`,
            metadata: { donationType, frequency }
        })
        console.log('✅ Product created:', product.id)

        console.log('💰 Creating price for product...')
        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: amount,
            currency: 'usd',
            recurring: { interval }
        })
        console.log('✅ Price created:', price.id)

        // 5. Create subscription with expanded payment intent
        console.log('🔄 Creating subscription...')
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
                donorPhone: phone,
                donationType,
                frequency,
            }
        })
        console.log('✅ Subscription created:', subscription.id)

        // 6. Extract payment intent from subscription
        console.log('📦 Extracting latest invoice and payment intent...')

        const invoice = subscription.latest_invoice as Stripe.Invoice
        if (!invoice || typeof invoice === 'string') {
            console.error('❌ Invoice not properly expanded')
            throw new Error('Invoice not properly expanded')
        }

        const paymentIntentRaw = invoice.payment_intent
        if (!paymentIntentRaw || typeof paymentIntentRaw === 'string') {
            console.warn('⚠️ No valid payment intent found. Creating fallback intent...')

            const newPaymentIntent = await stripe.paymentIntents.create({
                amount,
                currency: 'usd',
                customer: customer.id,
                setup_future_usage: 'off_session',
                metadata: {
                    donorName: name,
                    donorEmail: email,
                    donorPhone: phone,
                    donationType,
                    frequency,
                    subscriptionId: subscription.id
                }
            })

            console.log('✅ Fallback payment intent created:', newPaymentIntent.id)
            return NextResponse.json({
                clientSecret: newPaymentIntent.client_secret,
                subscriptionId: subscription.id
            })
        }

        const intent = paymentIntentRaw as Stripe.PaymentIntent
        console.log('✅ Client secret extracted from PaymentIntent:', intent.client_secret)

        return NextResponse.json({
            clientSecret: intent.client_secret,
            subscriptionId: subscription.id
        })

    } catch (err) {
        console.error('🔥 Subscription error:', err)
        return NextResponse.json(
            {
                message: 'Failed to create subscription',
                error: err instanceof Error ? err.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
