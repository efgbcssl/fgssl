// app/api/update-payment-intent/route.ts
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
    try {
        const body = await request.json()

        if (!body.amount || typeof body.amount !== 'number' || isNaN(body.amount)) {
            return NextResponse.json({ error: 'Invalid amount provided' }, { status: 400 })
        }


        // Create a new payment intent with the actual amount
        const updateIntent = await stripe.paymentIntents.update(body.id, {
            amount: body.amount,
            metadata: {
                donorName: body.metadata?.donorName || 'Anonymous',
                donorEmail: body.metadata?.donorEmail || '',
                donorPhone: body.metadata?.donorPhone || '',
                donationType: body.metadata?.donationType || 'General',
                paymentMethod: body.metadata?.paymentMethod || ''
            },
            receipt_email: body.metadata?.donorEmail
        })

        return NextResponse.json({ clientSecret: updateIntent.client_secret, paymentIntentId: updateIntent.id }, { status: 200 })
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        return NextResponse.json(
            { error: errorMessage },
            { status: 400 }
        )
    }
}