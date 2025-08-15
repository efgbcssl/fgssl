// app/api/stripe/verify-payment/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectMongoDB, getConnectionStatus } from '@/lib/mongodb';
import Donor from '@/models/Donor';
import Donation from '@/models/Donation';
import { sendDonationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

interface PaymentIntentWithCharges extends Stripe.PaymentIntent {
    charges: Stripe.ApiList<Stripe.Charge>;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent');

    console.log('🔵 [VERIFY-PAYMENT] Starting verification for:', paymentIntentId);

    if (!paymentIntentId) {
        console.log('🔴 Missing payment_intent parameter');
        return NextResponse.json(
            { error: 'Payment intent ID is required' },
            { status: 400 }
        );
    }

    try {
        // 1. Connect to MongoDB
        console.log('🔗 [DB] Connecting to MongoDB...');
        await connectMongoDB();
        console.log('🔗 [DB] Connection state:', getConnectionStatus());

        // 2. Retrieve payment intent from Stripe
        console.log('🔵 Retrieving payment intent from Stripe...');
        const response = await stripe.paymentIntents.retrieve(paymentIntentId, {
            expand: ['charges'],
        });
        const paymentIntent = response as unknown as PaymentIntentWithCharges;

        console.log('ℹ️ PaymentIntent status:', paymentIntent.status);
        console.log('ℹ️ Metadata:', { ...paymentIntent.metadata, donorEmail: '[masked]' });

        // 3. Validate payment status
        if (paymentIntent.status !== 'succeeded') {
            console.log(`🔴 Payment not succeeded (status: ${paymentIntent.status})`);
            return NextResponse.json(
                {
                    status: paymentIntent.status,
                    error: 'Payment not completed successfully',
                },
                { status: 400 }
            );
        }

        const charge = paymentIntent.charges?.data[0];
        const metadata = paymentIntent.metadata || {};
        const billingDetails = charge?.billing_details || {};

        // 4. Prepare receipt data with proper validation
        const receiptData = {
            donorName: metadata.donorName || billingDetails.name || 'Anonymous',
            donorEmail: metadata.donorEmail || billingDetails.email || paymentIntent.receipt_email || '',
            donorPhone: metadata.donorPhone || billingDetails.phone || '',
            amount: paymentIntent.amount / 100, // Convert cents to dollars
            currency: paymentIntent.currency.toUpperCase(),
            donationType: metadata.donationType || 'General Donation',
            paymentMethod: getPaymentMethodDescription(charge),
            receiptUrl: charge?.receipt_url || '',
            created: new Date(paymentIntent.created * 1000),
            isRecurring: false,
        };

        console.log('ℹ️ Prepared receipt data:', {
            ...receiptData,
            donorEmail: '[masked]',
            donorPhone: receiptData.donorPhone || '[empty]',
        });

        // 5. Validate required fields
        if (!receiptData.donorEmail) {
            console.log('🔴 Missing donor email');
            return NextResponse.json(
                { error: 'Email is required for donation processing' },
                { status: 400 }
            );
        }

        // 6. Check for existing donation (idempotency)
        console.log('🔵 Checking for existing donation...');
        const existingDonation = await Donation.findOne({ stripePaymentIntentId: paymentIntent.id }).lean();
        if (existingDonation) {
            console.log('ℹ️ Donation already exists in database:', existingDonation._id);
            return NextResponse.json({
                status: 'succeeded',
                message: 'Donation already processed',
                donation: existingDonation,
            });
        }

        // 7. Save donor information
        console.log('🔵 Saving donor information...');
        const donorStartTime = Date.now();
        try {
            const donor = await Donor.findOneAndUpdate(
                { email: receiptData.donorEmail },
                {
                    $set: {
                        name: receiptData.donorName,
                        phone: receiptData.donorPhone,
                        lastDonationDate: receiptData.created,
                        lastUpdated: new Date(),
                    },
                    $inc: { totalDonations: receiptData.amount },
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            ).catch((err) => {
                console.error('🔴 [DB] Donor save failed:', {
                    message: err.message,
                    code: err.code,
                    name: err.name,
                    errors: err.errors,
                    stack: err.stack,
                });
                throw err;
            });

            console.log('✅ [DB] Upserted donor:', {
                id: donor._id,
                email: '[masked]',
                totalDonations: donor.totalDonations,
            });
            console.log('🕒 [DB] Donor save took:', Date.now() - donorStartTime, 'ms');

            // 8. Save donation record
            console.log('🔵 Saving donation record...');
            const donationStartTime = Date.now();
            const newDonation = await Donation.create({
                donorsId: donor.donorsId || donor._id.toString(),
                amount: receiptData.amount,
                currency: receiptData.currency,
                donationType: receiptData.donationType,
                donorName: receiptData.donorName,
                donorEmail: receiptData.donorEmail,
                donorPhone: receiptData.donorPhone,
                paymentMethod: receiptData.paymentMethod,
                paymentStatus: 'succeeded',
                isRecurring: false,
                stripePaymentIntentId: paymentIntent.id,
                stripeChargeId: charge?.id,
                receiptUrl: receiptData.receiptUrl,
                createdAt: receiptData.created,
            }).catch((err) => {
                console.error('🔴 [DB] Donation save failed:', {
                    message: err.message,
                    code: err.code,
                    name: err.name,
                    errors: err.errors,
                    stack: err.stack,
                });
                throw err;
            });

            console.log('🟢 Donation saved successfully:', newDonation._id);
            console.log('🕒 [DB] Donation save took:', Date.now() - donationStartTime, 'ms');

            // 9. Send confirmation email
            console.log('🔵 Sending confirmation email...');
            try {
                const emailResponse = await sendDonationEmail({
                    to: receiptData.donorEmail,
                    donorName: receiptData.donorName,
                    amount: receiptData.amount,
                    donationType: receiptData.donationType,
                    receiptUrl: receiptData.receiptUrl,
                    createdDate: receiptData.created.toLocaleString(),
                    paymentMethod: receiptData.paymentMethod,
                    currency: receiptData.currency,
                    frequency: 'one-time',
                    isRecurring: false,
                });
                console.log('🟢 Email sent successfully:', emailResponse);
            } catch (emailError: any) {
                console.error('❌ Failed to send email:', emailError.message);
            }

            // 10. Return success response
            return NextResponse.json({
                status: 'succeeded',
                donation: newDonation,
            });
        } catch (donorError: any) {
            console.error('❌ Failed to save donor:', {
                message: donorError.message,
                code: donorError.code,
                name: donorError.name,
                errors: donorError.errors,
                stack: donorError.stack,
            });
            // Continue processing donation even if donor save fails
            console.log('🔵 Attempting to save donation despite donor save failure...');
            const donationStartTime = Date.now();
            const newDonation = await Donation.create({
                amount: receiptData.amount,
                currency: receiptData.currency,
                donationType: receiptData.donationType,
                donorName: receiptData.donorName,
                donorEmail: receiptData.donorEmail,
                donorPhone: receiptData.donorPhone,
                paymentMethod: receiptData.paymentMethod,
                paymentStatus: 'succeeded',
                isRecurring: false,
                stripePaymentIntentId: paymentIntent.id,
                stripeChargeId: charge?.id,
                receiptUrl: receiptData.receiptUrl,
                createdAt: receiptData.created,
            }).catch((err) => {
                console.error('🔴 [DB] Donation save failed:', {
                    message: err.message,
                    code: err.code,
                    name: err.name,
                    errors: err.errors,
                    stack: err.stack,
                });
                throw err;
            });

            console.log('🟢 Donation saved successfully:', newDonation._id);
            console.log('🕒 [DB] Donation save took:', Date.now() - donationStartTime, 'ms');

            // Send email
            try {
                const emailResponse = await sendDonationEmail({
                    to: receiptData.donorEmail,
                    donorName: receiptData.donorName,
                    amount: receiptData.amount,
                    donationType: receiptData.donationType,
                    receiptUrl: receiptData.receiptUrl,
                    createdDate: receiptData.created.toLocaleString(),
                    paymentMethod: receiptData.paymentMethod,
                    currency: receiptData.currency,
                    frequency: 'one-time',
                    isRecurring: false,
                });
                console.log('🟢 Email sent successfully:', emailResponse);
            } catch (emailError: any) {
                console.error('❌ Failed to send email:', emailError.message);
            }

            return NextResponse.json({
                status: 'succeeded',
                donation: newDonation,
            });
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Payment verification failed';
        console.error('🔴 [VERIFY-PAYMENT] Verification error:', {
            message,
            stack: err instanceof Error ? err.stack : undefined,
        });
        console.error('🔴 [DB] Connection state after error:', getConnectionStatus());
        return NextResponse.json(
            {
                status: 'error',
                error: message,
            },
            { status: 500 }
        );
    }
}

// Helper function to get payment method description
function getPaymentMethodDescription(charge?: Stripe.Charge): string {
    if (!charge) return 'card';

    if (charge.payment_method_details?.card) {
        const card = charge.payment_method_details.card;
        return `${card.brand.toUpperCase()} •••• ${card.last4}`;
    }

    return charge.payment_method_details?.type || 'card';
}