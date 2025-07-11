import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { xata } from '@/lib/xata'
import { sendDonationEmail } from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-05-28.basil'
})
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

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

    // Handle payment success
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const metadata = paymentIntent.metadata || {}

        try {
            // Get charge details (for receipt URL)
            const charges = await stripe.charges.list({
                payment_intent: paymentIntent.id,
                limit: 1
            })
            const charge = charges.data[0]

            // Prepare donor data
            const donorData = {
                name: metadata.donorName || 'Anonymous',
                email: metadata.donorEmail,
                phone: metadata.donorPhone || '',
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency.toUpperCase(),
                donationType: metadata.donationType || 'General',
                paymentMethod: paymentIntent.payment_method_types?.[0] || 'card',
                receiptUrl: charge?.receipt_url || '',
                created: new Date(paymentIntent.created * 1000)
            }

            // Validate required fields
            if (!donorData.email) {
                console.error('Missing donor email in payment intent:', paymentIntent.id)
                return NextResponse.json(
                    { error: 'Missing donor email' },
                    { status: 400 }
                )
            }

            // 1. Save/update donor in Xata
            let donor = await xata.db.donors
                .filter({ email: donorData.email })
                .getFirst()

            if (donor) {
                await xata.db.donors.update(donor.xata_id, {
                    name: donorData.name,
                    phone: donorData.phone,
                    totalDonations: (donor.totalDonations || 0) + donorData.amount,
                    lastDonationDate: donorData.created.toISOString()
                })
            } else {
                donor = await xata.db.donors.create({
                    name: donorData.name,
                    email: donorData.email,
                    phone: donorData.phone,
                    totalDonations: donorData.amount,
                    lastDonationDate: donorData.created.toISOString()
                })
            }

            // 2. Save donation record
            await xata.db.donations.create({
                amount: donorData.amount,
                currency: donorData.currency,
                donationType: donorData.donationType,
                donorName: donorData.name,
                donorEmail: donorData.email,
                donorPhone: donorData.phone,
                paymentMethod: donorData.paymentMethod,
                paymentStatus: 'succeeded',
                stripePaymentIntentId: paymentIntent.id,
                stripeChargeId: charge?.id,
                receiptUrl: donorData.receiptUrl,
                isRecurring: false,
                // Replace 'date' with the correct field name if it exists in your schema, e.g. 'createdAt'
                // createdAt: donorData.created.toISOString()
            })

            // 3. Send confirmation email
            try {
                await sendDonationEmail({
                    to: donorData.email,
                    donorName: donorData.name,
                    amount: donorData.amount,
                    donationType: donorData.donationType,
                    receiptUrl: donorData.receiptUrl,
                    createdDate: donorData.created,
                    paymentMethod: donorData.paymentMethod,
                    currency: donorData.currency
                })
            } catch (emailError) {
                console.error('Failed to send donation email:', emailError)
            }

            console.log(`✅ Successfully processed payment ${paymentIntent.id}`)
            return NextResponse.json({ received: true })

        } catch (err) {
            console.error('Error processing payment intent:', paymentIntent.id, err)
            return NextResponse.json(
                { error: 'Failed to process payment' },
                { status: 500 }
            )
        }
    }

    if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object as Stripe.Invoice

        try {
            const subscription = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
            const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
            const customerEmail = invoice.customer_email
            const amount = invoice.amount_paid / 100
            const currency = invoice.currency.toUpperCase()
            const paymentMethod = invoice.payment_settings?.payment_method_types?.[0] || 'card'
            const receiptUrl = invoice.hosted_invoice_url || ''
            const createdDate = new Date(invoice.created * 1000)

            // fallback if no email
            if (!customerEmail) {
                console.error('❌ Missing email on recurring invoice:', invoice.id)
                return NextResponse.json({ error: 'Missing email' }, { status: 400 })
            }

            // Save or update donor
            let donor = await xata.db.donors.filter({ email: customerEmail }).getFirst()
            if (donor) {
                await xata.db.donors.update(donor.xata_id, {
                    totalDonations: (donor.totalDonations || 0) + amount,
                    lastDonationDate: createdDate.toISOString()
                })
            } else {
                donor = await xata.db.donors.create({
                    email: customerEmail,
                    name: invoice.customer_name || 'Recurring Donor',
                    totalDonations: amount,
                    lastDonationDate: createdDate.toISOString()
                })
            }

            // Save donation
            await xata.db.donations.create({
                amount,
                currency,
                donationType: 'Recurring Subscription',
                donorEmail: customerEmail,
                donorName: invoice.customer_name || 'Recurring Donor',
                donorPhone: '', // subscriptions often lack phone
                isRecurring: true,
                paymentMethod,
                paymentStatus: 'succeeded',
                stripeChargeId: invoice.charge as string,
                stripePaymentIntentId: invoice.payment_intent as string,
                receiptUrl
            })

            // Optional: send email
            try {
                await sendDonationEmail({
                    to: customerEmail,
                    donorName: invoice.customer_name || 'Recurring Donor',
                    amount,
                    donationType: 'Recurring Subscription',
                    receiptUrl,
                    createdDate,
                    paymentMethod,
                    currency
                })
            } catch (err) {
                console.error('Failed to send recurring donation email:', err)
            }

            console.log(`✅ Recurring donation saved from invoice ${invoice.id}`)
            return NextResponse.json({ received: true })
        } catch (err) {
            console.error('❌ Error processing recurring invoice:', err)
            return NextResponse.json({ error: 'Failed recurring donation' }, { status: 500 })
        }
    }


    // Handle other event types
    console.log(`ℹ️ Unhandled event type: ${event.type}`)
    return NextResponse.json({ received: true })
}