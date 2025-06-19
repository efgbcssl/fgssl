// app/api/update-payment-intent/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
    try {
        const { amount, currency, metadata } = await request.json()

        // Create a new payment intent with the actual amount
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            automatic_payment_methods: {
                enabled: true,
            },
            metadata
        })

        return NextResponse.json({ clientSecret: paymentIntent.client_secret })
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        return NextResponse.json(
            { error: errorMessage },
            { status: 400 }
        )
    }
}