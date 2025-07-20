import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { xata } from '@/lib/xata'
import { sendDonationEmail } from '@/lib/email'
import { generateDonationReceiptPDF } from '@/lib/pdf'

interface PaymentIntentWithCharges extends Stripe.PaymentIntent {
    charges: Stripe.ApiList<Stripe.Charge>
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-05-28.basil'
})

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const paymentIntentId = searchParams.get('payment_intent')

    console.log('🔵 [VERIFY-PAYMENT] Starting verification for:', paymentIntentId)

    if (!paymentIntentId) {
        console.log('🔴 Missing payment_intent parameter')
        return NextResponse.json(
            { error: 'Payment intent ID is required' },
            { status: 400 }
        )
    }

    try {
        // 1. Retrieve payment intent from Stripe
        console.log('🔵 Retrieving payment intent from Stripe...')
        const response = await stripe.paymentIntents.retrieve(paymentIntentId, {
            expand: ['charges']
        })
        const paymentIntent = response as unknown as PaymentIntentWithCharges

        console.log('ℹ️ PaymentIntent status:', paymentIntent.status)
        console.log('ℹ️ Metadata:', paymentIntent.metadata)

        // 2. Validate payment status
        if (paymentIntent.status !== 'succeeded') {
            console.log(`🔴 Payment not succeeded (status: ${paymentIntent.status})`)
            return NextResponse.json(
                {
                    status: paymentIntent.status,
                    error: 'Payment not completed successfully'
                },
                { status: 400 }
            )
        }

        const charge = paymentIntent.charges?.data[0]
        const metadata = paymentIntent.metadata || {}
        const billingDetails = charge?.billing_details || {}

        // 3. Prepare receipt data with proper validation
        const receiptData = {
            donorName: metadata.donorName || billingDetails.name || 'Anonymous',
            donorEmail: metadata.donorEmail || billingDetails.email || paymentIntent.receipt_email || '',
            donorPhone: metadata.donorPhone || billingDetails.phone || '',
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency.toUpperCase(),
            donationType: metadata.donationType || 'General Donation',
            paymentMethod: getPaymentMethodDescription(charge),
            receiptUrl: charge?.receipt_url || '',
            created: paymentIntent.created,
            isRecurring: false
        }

        console.log('ℹ️ Prepared receipt data:', receiptData)

        // 4. Validate required fields
        if (!receiptData.donorEmail) {
            console.log('🔴 Missing donor email')
            return NextResponse.json(
                { error: "Email is required for donation processing" },
                { status: 400 }
            )
        }

        // 5. Check for existing donation (idempotency)
        console.log('🔵 Checking for existing donation...')
        const existingDonation = await xata.db.donations
            .filter({ stripePaymentIntentId: paymentIntent.id })
            .getFirst()

        if (existingDonation) {
            console.log('ℹ️ Donation already exists in database')
            return NextResponse.json({
                status: 'succeeded',
                message: 'Donation already processed',
                donation: existingDonation
            })
        }

        // 6. Save donor information
        console.log('🔵 Saving donor information...')
        try {
            const existingDonor = await xata.db.donors
                .filter({ email: receiptData.donorEmail })
                .getFirst()

            if (existingDonor) {
                console.log('ℹ️ Updating existing donor')
                await xata.db.donors.update(existingDonor.xata_id, {
                    name: receiptData.donorName,
                    phone: receiptData.donorPhone,
                    totalDonations: (existingDonor.totalDonations || 0) + receiptData.amount,
                    lastDonationDate: new Date().toISOString(),
                })
            } else {
                console.log('ℹ️ Creating new donor')
                await xata.db.donors.create({
                    name: receiptData.donorName,
                    email: receiptData.donorEmail,
                    phone: receiptData.donorPhone,
                    totalDonations: receiptData.amount,
                    lastDonationDate: new Date().toISOString(),
                })
            }
        } catch (dbError) {
            console.error('❌ Failed to save donor:', dbError)
            // Continue processing even if donor save fails
        }

        // 7. Save donation record
        console.log('🔵 Saving donation record...')
        const newDonation = await xata.db.donations.create({
            amount: receiptData.amount,
            currency: receiptData.currency,
            donationType: receiptData.donationType,
            donorName: receiptData.donorName,
            donorEmail: receiptData.donorEmail,
            donorPhone: receiptData.donorPhone,
            paymentMethod: receiptData.paymentMethod,
            paymentStatus: 'succeeded',
            stripePaymentIntentId: paymentIntent.id,
            stripeChargeId: charge?.id,
            receiptUrl: receiptData.receiptUrl,
            isRecurring: false
        })

        if (!newDonation) {
            console.error('🔴 Failed to create donation record')
            throw new Error('Failed to create donation record')
        }

        console.log('🟢 Donation saved successfully:', newDonation.xata_id)

        // 8. Generate PDF receipt
        console.log('🔵 Generating PDF receipt...')
        try {
            await generateDonationReceiptPDF({
                donorName: receiptData.donorName,
                amount: receiptData.amount,
                donationType: receiptData.donationType,
                receiptUrl: receiptData.receiptUrl,
                createdDate: new Date(receiptData.created * 1000).toLocaleString(),
                receiptNumber: paymentIntent.id.slice(-8), // Last 8 chars as receipt number
                frequency: 'one-time',
                isRecurring: false,
            })
            console.log('🟢 PDF generated successfully')
        } catch (pdfError) {
            console.error('❌ PDF generation failed:', pdfError)
        }

        // 9. Send confirmation email
        console.log('🔵 Sending confirmation email...')
        try {
            const emailResponse = await sendDonationEmail({
                to: receiptData.donorEmail,
                donorName: receiptData.donorName,
                amount: receiptData.amount,
                donationType: receiptData.donationType,
                receiptUrl: receiptData.receiptUrl,
                createdDate: new Date(receiptData.created * 1000).toLocaleString(),
                paymentMethod: receiptData.paymentMethod,
                currency: receiptData.currency,
                frequency: 'one-time',
                isRecurring: false
            })
            console.log('🟢 Email sent successfully:', emailResponse)
        } catch (emailError) {
            console.error('❌ Failed to send email:', emailError)
        }

        // 10. Return success response
        return NextResponse.json({
            status: 'succeeded',
            donation: newDonation
        })

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Payment verification failed'
        console.error('🔴 Verification error:', message)
        return NextResponse.json(
            {
                status: 'error',
                error: message
            },
            { status: 500 }
        )
    }
}

// Helper function to get payment method description
function getPaymentMethodDescription(charge?: Stripe.Charge): string {
    if (!charge) return 'card'

    if (charge.payment_method_details?.card) {
        const card = charge.payment_method_details.card
        return `${card.brand} •••• ${card.last4}`
    }

    return charge.payment_method_details?.type || 'card'
}