import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { xata } from '@/lib/xata'
import { sendDonationEmail } from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-05-28.basil'
})
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

interface DonorRecord {
    name?: string
    email: string
    phone?: string
    totalDonations?: number
    lastDonationDate?: string
    donationFrequency?: string
}

interface DonationRecord {
    amount: number
    currency: string
    donationType: string
    frequency?: string
    donorName: string
    donorEmail: string
    donorPhone?: string
    paymentMethod: string
    paymentStatus: string
    isRecurring: boolean
    stripePaymentIntentId?: string
    stripeChargeId?: string
    stripeSubscriptionId?: string
    receiptUrl?: string
    date: string
}

export async function POST(req: Request) {
    const body = await req.text()
    const sig = (await headers()).get('stripe-signature')

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(body, sig!, endpointSecret)
    } catch (err) {
        console.error('⚠️ Webhook signature verification failed:', err)
        return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 400 }
        )
    }

    // Handle payment success events
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const metadata = paymentIntent.metadata || {}

        console.log('✅ Received metadata:', metadata)

        try {
            // Get charge details
            const charge = paymentIntent.latest_charge ?
                await stripe.charges.retrieve(paymentIntent.latest_charge as string) :
                null

            // Prepare donor data
            const donorData = {
                name: metadata.donorName || 'Anonymous',
                email: metadata.donorEmail || (charge?.billing_details?.email || ''),
                phone: metadata.donorPhone || (charge?.billing_details?.phone || ''),
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency.toUpperCase(),
                donationType: metadata.donationType || 'General Donation',
                frequency: metadata.frequency || 'one-time',
                paymentMethod: paymentIntent.payment_method_types?.[0] || 'card',
                receiptUrl: charge?.receipt_url || '',
                created: new Date(paymentIntent.created * 1000),
                subscriptionId: metadata.subscriptionId
            }

            if (!donorData.email) {
                console.error('Missing donor email in payment intent:', paymentIntent.id)
                return NextResponse.json(
                    { error: 'Missing donor email' },
                    { status: 400 }
                )
            }

            // Save/update donor
            let donor = await xata.db.donors
                .filter({ email: donorData.email })
                .getFirst()

            const donorUpdate: Partial<DonorRecord> = {
                name: donorData.name,
                phone: donorData.phone,
                totalDonations: (donor?.totalDonations || 0) + donorData.amount,
                lastDonationDate: donorData.created.toISOString(),
                donationFrequency: donorData.frequency
            }

            if (donor) {
                await xata.db.donors.update(donor.email, donorUpdate)
            } else {
                donor = await xata.db.donors.create({
                    ...donorUpdate,
                    email: donorData.email
                } as DonorRecord)
            }

            // Save donation record
            const donationRecord: DonationRecord = {
                amount: donorData.amount,
                currency: donorData.currency,
                donationType: donorData.donationType,
                frequency: donorData.frequency,
                donorName: donorData.name,
                donorEmail: donorData.email,
                donorPhone: donorData.phone,
                paymentMethod: donorData.paymentMethod,
                paymentStatus: 'succeeded',
                isRecurring: donorData.frequency !== 'one-time',
                stripePaymentIntentId: paymentIntent.id,
                stripeChargeId: charge?.id,
                stripeSubscriptionId: donorData.subscriptionId,
                receiptUrl: donorData.receiptUrl,
                date: donorData.created.toISOString()
            }

            await xata.db.donations.create(donationRecord)

            // Send confirmation email
            try {
                await sendDonationEmail({
                    to: donorData.email,
                    donorName: donorData.name,
                    amount: donorData.amount,
                    donationType: donorData.donationType,
                    receiptUrl: donorData.receiptUrl,
                    createdDate: donorData.created,
                    paymentMethod: donorData.paymentMethod,
                    currency: donorData.currency,
                    frequency: donorData.frequency,
                    isRecurring: donorData.frequency !== 'one-time'
                })
            } catch (emailError) {
                console.error('Failed to send donation email:', emailError)
            }

            console.log(`✅ Processed payment ${paymentIntent.id}`)
            return NextResponse.json({ received: true })

        } catch (err) {
            console.error('Error processing payment intent:', paymentIntent.id, err)
            return NextResponse.json(
                { error: 'Failed to process payment' },
                { status: 500 }
            )
        }
    }

    // Handle subscription payments
    if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object as Stripe.Invoice

        try {
            // Get subscription details
            const subscription = invoice.subscription ?
                await stripe.subscriptions.retrieve(invoice.subscription as string) :
                null

            // Get customer details
            const customer = await stripe.customers.retrieve(invoice.customer as string)
            const customerEmail = invoice.customer_email ||
                (typeof customer === 'object' ? customer.email : null)
            const customerName = typeof customer === 'object' ? customer.name : 'Recurring Donor'

            // Get payment intent
            const paymentIntent = invoice.payment_intent ?
                await stripe.paymentIntents.retrieve(invoice.payment_intent as string) :
                null

            // Prepare donation data
            const donationData = {
                email: customerEmail,
                name: customerName,
                amount: invoice.amount_paid / 100,
                currency: invoice.currency.toUpperCase(),
                donationType: subscription?.metadata?.donationType || 'Recurring Donation',
                frequency: subscription?.metadata?.frequency || 'monthly',
                paymentMethod: paymentIntent?.payment_method_types?.[0] || 'card',
                receiptUrl: invoice.hosted_invoice_url || '',
                created: new Date(invoice.created * 1000),
                subscriptionId: subscription?.id
            }

            if (!donationData.email) {
                console.error('Missing email on invoice:', invoice.id)
                return NextResponse.json({ error: 'Missing email' }, { status: 400 })
            }

            // Save/update donor
            let donor = await xata.db.donors
                .filter({ email: donationData.email })
                .getFirst()

            const donorUpdate: Partial<DonorRecord> = {
                name: donationData.name,
                totalDonations: (donor?.totalDonations || 0) + donationData.amount,
                lastDonationDate: donationData.created.toISOString(),
                donationFrequency: donationData.frequency
            }

            if (donor) {
                await xata.db.donors.update(donor.email, donorUpdate)
            } else {
                donor = await xata.db.donors.create({
                    ...donorUpdate,
                    email: donationData.email
                } as DonorRecord)
            }

            // Save donation record
            const donationRecord: DonationRecord = {
                amount: donationData.amount,
                currency: donationData.currency,
                donationType: donationData.donationType,
                frequency: donationData.frequency,
                donorName: donationData.name,
                donorEmail: donationData.email,
                paymentMethod: donationData.paymentMethod,
                paymentStatus: 'succeeded',
                isRecurring: true,
                stripePaymentIntentId: paymentIntent?.id,
                stripeSubscriptionId: donationData.subscriptionId,
                receiptUrl: donationData.receiptUrl,
                date: donationData.created.toISOString()
            }

            await xata.db.donations.create(donationRecord)

            // Send confirmation email
            try {
                await sendDonationEmail({
                    to: donationData.email,
                    donorName: donationData.name,
                    amount: donationData.amount,
                    donationType: donationData.donationType,
                    receiptUrl: donationData.receiptUrl,
                    createdDate: donationData.created,
                    paymentMethod: donationData.paymentMethod,
                    currency: donationData.currency,
                    frequency: donationData.frequency,
                    isRecurring: true
                })
            } catch (err) {
                console.error('Failed to send recurring donation email:', err)
            }

            console.log(`✅ Processed recurring payment from invoice ${invoice.id}`)
            return NextResponse.json({ received: true })

        } catch (err) {
            console.error('Error processing invoice:', invoice.id, err)
            return NextResponse.json(
                { error: 'Failed to process recurring payment' },
                { status: 500 }
            )
        }
    }

    // Handle subscription lifecycle events
    if (event.type === 'customer.subscription.created') {
        const subscription = event.data.object as Stripe.Subscription
        console.log(`ℹ️ New subscription created: ${subscription.id}`)
        return NextResponse.json({ received: true })
    }

    if (event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as Stripe.Subscription
        console.log(`ℹ️ Subscription updated: ${subscription.id}`)
        return NextResponse.json({ received: true })
    }

    if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as Stripe.Subscription
        console.log(`ℹ️ Subscription canceled: ${subscription.id}`)
        return NextResponse.json({ received: true })
    }

    console.log(`ℹ️ Unhandled event type: ${event.type}`)
    return NextResponse.json({ received: true })
}