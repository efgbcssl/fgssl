import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
    try {
        const { amount, currency, metadata } = await request.json()

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            automatic_payment_methods: {
                enabled: true,
            },
            metadata
        })

        return NextResponse.json({ clientSecret: paymentIntent.client_secret })
    } catch (error: unknown) {
        let errorMessage = 'An unknown error occurred';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return NextResponse.json(
            { error: errorMessage },
            { status: 400 }
        )
    }
}