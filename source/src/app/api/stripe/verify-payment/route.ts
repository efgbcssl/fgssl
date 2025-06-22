import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { xata } from '@/lib/xata'
import { sendDonationEmail } from '@/lib/email'
import { generateDonationReceiptPDF } from '@/lib/pdf';

interface PaymentIntentWithCharges extends Stripe.PaymentIntent {
    charges: Stripe.ApiList<Stripe.Charge>;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-05-28.basil'
})

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
        // Retrieve payment intent with expanded charges
        const response = await stripe.paymentIntents.retrieve(paymentIntentId, {
            expand: ['charges']
        })
        const paymentIntent = response as unknown as PaymentIntentWithCharges

        // Validate payment success
        if (paymentIntent.status !== 'succeeded') {
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

        // Compose receipt data matching your thank-you page interface
        const receiptData = {
            donorName: metadata.donorName || billingDetails.name || 'Anonymous',
            donorEmail: metadata.donorEmail || billingDetails.email || paymentIntent.receipt_email || '',
            donorPhone: metadata.donorPhone || billingDetails.phone || '',
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency.toUpperCase(),
            donationType: metadata.donationType || 'General',
            paymentMethod: paymentIntent.payment_method_types?.[0] || 'card',
            receiptUrl: charge?.receipt_url || '',
            created: paymentIntent.created
        }

        // Validate required fields
        if (!receiptData.donorEmail) {
            return NextResponse.json(
                { error: "Email is required for donation processing" },
                { status: 400 }
            )
        }

        // 1. Save/update donor in Xata
        try {
            const existingDonor = await xata.db.donors
                .filter({ email: receiptData.donorEmail })
                .getFirst()

            if (existingDonor) {
                await xata.db.donors.update(existingDonor.xata_id, {
                    name: receiptData.donorName,
                    phone: receiptData.donorPhone,
                    totalDonations: (existingDonor.totalDonations || 0) + receiptData.amount,
                    lastDonationDate: new Date().toISOString(),
                })
            } else {
                await xata.db.donors.create({
                    name: receiptData.donorName,
                    email: receiptData.donorEmail,
                    phone: receiptData.donorPhone,
                    totalDonations: receiptData.amount,
                    lastDonationDate: new Date().toISOString(),
                })
            }
        } catch (dbError) {
            console.error('Failed to save donor:', dbError)
        }

        // 2. Save donation record
        try {
            await xata.db.donations.create({
                // Only include fields that exist in DonationsRecord
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
                isRecurring: false,
            })
        } catch (dbError) {
            console.error('Failed to save donation:', dbError)
        }
        console.log('🟡 Receipt data:', receiptData, receiptData.donorEmail)
        await generateDonationReceiptPDF({
            donorName: receiptData.donorName,
            amount: receiptData.amount,
            donationType: receiptData.donationType,
            receiptUrl: receiptData.receiptUrl,
            createdDate: new Date(receiptData.created * 1000).toLocaleString(),
        })
        console.log('✅ PDF generated for', receiptData.donorName)


        // 4. Send confirmation email
        try {
            if (receiptData.donorEmail) {
                const emailResponse = await sendDonationEmail({
                    to: receiptData.donorEmail,
                    donorName: receiptData.donorName,
                    amount: receiptData.amount,
                    donationType: receiptData.donationType,
                    receiptUrl: receiptData.receiptUrl,
                    createdDate: new Date(receiptData.created * 1000).toLocaleString(),
                })
                console.log("✅ Email sent successfully:", emailResponse)
            }
        } catch (emailError) {
            console.error("❌ Failed to send donation email:", emailError)            // Continue even if email fails
        }

        // Return response matching your thank-you page expectations
        return NextResponse.json({
            status: 'succeeded',
            metadata: {
                donorName: receiptData.donorName,
                donorEmail: receiptData.donorEmail,
                donorPhone: receiptData.donorPhone,
                donationType: receiptData.donationType
            },
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            payment_method_types: paymentIntent.payment_method_types,
            charges: paymentIntent.charges?.data.length ? {
                data: [{
                    receipt_url: receiptData.receiptUrl
                }]
            } : undefined,
            created: paymentIntent.created
        })

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Payment verification failed'
        console.error('Payment verification error:', message)
        return NextResponse.json(
            {
                status: 'error',
                error: message
            },
            { status: 500 }
        )
    }
}