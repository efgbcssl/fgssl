// app/api/stripe/create-payment-intent/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-05-28.basil'
})

export async function POST(request: Request) {
    console.log('📩 Received POST request to /create-payment-intent')

    try {
        const body = await request.json()
        console.log('✅ Parsed request body:', body)

        const { name, amount, donationType, currency = 'usd', metadata, email, phone } = body

        console.log('🔍 Validating amount...')
        if (isNaN(amount) || amount <= 0) {
            console.error('❌ Invalid amount:', amount)
            throw new Error('Invalid amount provided')
        }
        console.log('✅ Amount is valid:', amount)

        console.log('💳 Creating PaymentIntent...')
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            customer: metadata?.customerId,
            metadata: {
                donorName: name,
                donorEmail: email,
                donorPhone: phone,
                donationType
            },
            automatic_payment_methods: {
                enabled: true,
            },
        })
        console.log('✅ PaymentIntent created:', paymentIntent.id)

        if (!paymentIntent.client_secret) {
            console.error('❌ PaymentIntent missing client_secret')
            throw new Error('Failed to create payment intent')
        }

        console.log('🎯 Sending response with clientSecret')
        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            customerId: metadata?.customerId || null,
        })

    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
        console.error('🔥 Error creating PaymentIntent:', errorMessage)
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        )
    }
}
