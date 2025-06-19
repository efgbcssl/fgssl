import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { XataClient } from '@/xata'

const xata = new XataClient()

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET
    if (!WEBHOOK_SECRET) {
        throw new Error('STRIPE_WEBHOOK_SECRET is not set')
    }

    const headerPayload = await headers()
    const svix_id = headerPayload.get("svix-id")
    const svix_timestamp = headerPayload.get("svix-timestamp")
    const svix_signature = headerPayload.get("svix-signature")

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', {
            status: 400
        })
    }

    const payload = await req.json()
    const wh = new Webhook(WEBHOOK_SECRET)
    let evt: WebhookEvent

    try {
        evt = wh.verify(JSON.stringify(payload), {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent
    } catch (err) {
        console.error('Error verifying webhook:', err)
        return new Response('Error verifying webhook', {
            status: 400
        })
    }

    const eventType = evt.type

    // Handle payment intent succeeded
    if (eventType === 'payment_intent.succeeded') {
        const paymentIntent = evt.data.object
        const amount = paymentIntent.amount / 100
        const currency = paymentIntent.currency
        const donationType = paymentIntent.metadata.donationType || 'General'
        const donorEmail = paymentIntent.receipt_email || paymentIntent.metadata.donorEmail
        const donorName = paymentIntent.metadata.donorName
        const donorPhone = paymentIntent.metadata.donorPhone || ''
        const paymentMethod = paymentIntent.payment_method_types?.[0] || 'card'
        const charge = paymentIntent.charges?.data?.[0]
        const receiptUrl = charge?.receipt_url

        try {
            // Save donation to Xata
            const donation = await xata.db.donations.create({
                amount,
                currency,
                donationType,
                donorName,
                donorEmail,
                donorPhone,
                paymentMethod,
                paymentStatus: 'succeeded',
                stripePaymentIntentId: paymentIntent.id,
                stripeChargeId: charge?.id,
                receiptUrl,
                isRecurring: paymentIntent.setup_future_usage !== null
            })

            // Update or create donor record
            const donor = await xata.db.donors.filter({ email: donorEmail }).getFirst()
            if (donor) {
                await donor.update({
                    totalDonations: (donor.totalDonations || 0) + amount,
                    lastDonationDate: new Date().toISOString()
                })
            } else {
                await xata.db.donors.create({
                    name: donorName,
                    email: donorEmail,
                    phone: donorPhone,
                    totalDonations: amount,
                    lastDonationDate: new Date().toISOString()
                })
            }

            return new Response(JSON.stringify({ success: true, donationId: donation.id }), {
                status: 200
            })
        } catch (error) {
            console.error('Error saving donation:', error)
            return new Response('Error saving donation', {
                status: 500
            })
        }
    }

    return new Response('', { status: 200 })
}