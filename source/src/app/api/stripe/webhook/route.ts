import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { xata } from '@/lib/xata'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
    const body = await req.text()
    const sig = (await headers()).get('stripe-signature')

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(body, sig!, endpointSecret)
    } catch {
        return NextResponse.json({ error: 'Webhook Error' }, { status: 400 })
    }

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        // Retrieve the associated charge using the Stripe API
        const chargesList = await stripe.charges.list({ payment_intent: paymentIntent.id, limit: 1 })
        const charge = chargesList.data[0]

        const meta = paymentIntent.metadata
        const email = meta?.donorEmail
        const name = meta?.donorName

        // Save donor
        let donor = await xata.db.donors.filter({ email }).getFirst()
        if (!donor) {
            donor = await xata.db.donors.create({ name, email, phone: meta?.donorPhone })
        }

        await xata.db.donors.update(donor.donor_id, {
            totalDonations: (donor.totalDonations || 0) + (paymentIntent.amount / 100),
            lastDonationDate: new Date(paymentIntent.created * 1000),
        })

        // Save donation
        await xata.db.donations.create({
            donation_id: paymentIntent.id,
            donor_id: donor.donor_id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            donationType: meta?.donationType || 'Unknown',
            donorName: name,
            donorEmail: email,
            donorPhone: meta?.donorPhone,
            paymentMethod: 'card',
            paymentStatus: 'succeeded',
            stripePaymentIntentId: paymentIntent.id,
            stripeChargeId: charge?.id,
            receiptUrl: charge?.receipt_url,
            isRecurring: false,
            notes: meta?.notes || '',
        })
    }

    return NextResponse.json({ received: true })
}