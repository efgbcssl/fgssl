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

        return NextResponse.json({
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            donationType: paymentIntent.metadata?.donationType || 'Offering',
            metadata: paymentIntent.metadata,
            receipt_url: paymentIntent.charges.data[0]?.receipt_url || null,
            created: paymentIntent.created,
            chargeId: paymentIntent.charges.data[0]?.id,
            balanceTransactionId: paymentIntent.charges.data[0]?.balance_transaction
        })
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        return NextResponse.json(
            { error: errorMessage },
            { status: 400 }
        )
    }
}