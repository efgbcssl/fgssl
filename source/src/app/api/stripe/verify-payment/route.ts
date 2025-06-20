import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { xata } from '@/lib/xata'
import { sendDonationEmail } from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const paymentIntentId = searchParams.get('payment_intent')

    if (!paymentIntentId) {
        return NextResponse.json({ error: 'Payment intent ID is required' }, { status: 400 })
    }

    try {
        const paymentIntent: Stripe.PaymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
            expand: ['charges'],
        })

        // Validate payment success
        if (paymentIntent.status !== 'succeeded') {
            return NextResponse.json({ error: 'Payment not succeeded' }, { status: 400 })
        }

        const charge = paymentIntent.charges?.data[0]
        const metadata = paymentIntent.metadata || {}

        const amount = paymentIntent.amount / 100
        const donationType = metadata.donationType || 'General'
        const donorName = metadata.donorName || 'Anonymous'
        const donorEmail = metadata.donorEmail
        const donorPhone = metadata.donorPhone || ''
        const paymentMethod = paymentIntent.payment_method_types[0]
        const receiptUrl = charge?.receipt_url || ''

        // 1. Save donor
        const existingDonor = await xata.db.donors.filter({ email: donorEmail }).getFirst()

        if (existingDonor) {
            await xata.db.donors.update(existingDonor.xata_id, {
                name: donorName,
                phone: donorPhone,
                totalDonations: (existingDonor.totalDonations || 0) + amount,
                lastDonationDate: new Date(),
            })
        } else {
            await xata.db.donors.create({
                name: donorName,
                email: donorEmail,
                phone: donorPhone,
                totalDonations: amount,
                lastDonationDate: new Date(),
            })
        }

        // 2. Save donation
        await xata.db.donations.create({
            amount,
            currency: paymentIntent.currency.toUpperCase(),
            donationType,
            donorName,
            donorEmail,
            donorPhone,
            paymentMethod,
            paymentStatus: 'succeeded',
            stripePaymentIntentId: paymentIntent.id,
            stripeChargeId: charge?.id,
            receiptUrl,
            isRecurring: false,
        })

        // 3. Send email
        await sendDonationEmail({
            to: donorEmail,
            donorName,
            amount,
            donationType,
            receiptUrl,
        })

        // 4. Return success response
        return NextResponse.json({
            status: 'succeeded',
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            donationType,
            receipt_url: receiptUrl,
            created: paymentIntent.created,
        })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred'
        console.error('Payment verification failed:', message)
        return NextResponse.json({ error: message }, { status: 400 })
    }
}
