import { NextResponse } from 'next/server'
import Stripe from 'stripe'

interface PaymentIntentWithCharges extends Stripe.PaymentIntent {
    charges: Stripe.ApiList<Stripe.Charge>;
}


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const paymentIntentId = searchParams.get('payment_intent')

    if (!paymentIntentId) {
        return NextResponse.json(
            { error: 'Payment intent ID is required' },
            { status: 400 }
        )
    }

    try {
        const response = await stripe.paymentIntents.retrieve(paymentIntentId, {
            expand: ['charges']
        })

        const paymentIntent = response as unknown as PaymentIntentWithCharges

        if (paymentIntent.status !== 'succeeded') {
            return NextResponse.json(
                { error: 'Payment not succeeded' },
                { status: 400 }
            )
        }

        return NextResponse.json({
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            metadata: paymentIntent.metadata,
            receipt_url: paymentIntent.charges.data[0]?.receipt_url || null
        })
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        return NextResponse.json(
            { error: errorMessage },
            { status: 400 }
        )
    }
}