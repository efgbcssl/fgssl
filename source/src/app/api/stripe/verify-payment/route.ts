// src/app/api/stripe/verify-payment/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const paymentIntentId = searchParams.get('payment_intent')

    if (!paymentIntentId) {
        return NextResponse.json({ status: 'failed', error: 'Missing payment intent ID' })
    }

    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
            expand: ['charges'],
        })

        const charges = (paymentIntent as any)?.charges?.data
        const firstCharge = Array.isArray(charges) ? charges[0] : null

        if (paymentIntent.status !== 'succeeded') {
            return NextResponse.json({ status: paymentIntent.status }) // still return 200
        }

        return NextResponse.json({
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            donationType: paymentIntent.metadata?.donationType || 'Offering',
            metadata: paymentIntent.metadata,
            receipt_url: firstCharge?.receipt_url || null,
            created: paymentIntent.created,
            chargeId: firstCharge?.id || null,
            balanceTransactionId: firstCharge?.balance_transaction || null,
        })
    } catch (err: any) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({ status: 'failed', error: errorMessage })
    }
}
