// app/api/stripe/verify-payment/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectMongoDB } from '@/lib/mongodb';
import Donor from '@/models/Donor';
import Donation from '@/models/Donation';
import { sendDonationEmail } from '@/lib/email';
import { Document } from 'mongoose';

export const dynamic = 'force-dynamic';

interface PaymentIntentWithCharges extends Stripe.PaymentIntent {
    charges: Stripe.ApiList<Stripe.Charge>;
}

interface DonorDocument extends Document {
    _id: string;
    donorsId?: string;
    email: string;
    name: string;
    phone?: string;
    totalDonations: number;
    lastDonationDate: Date;
    lastUpdated: Date;
}

interface DonationDocument extends Document {
    _id: string;
    donorsId?: string;
    amount: number;
    currency: string;
    donationType: string;
    donorName: string;
    donorEmail: string;
    donorPhone?: string;
    paymentMethod: string;
    paymentStatus: string;
    isRecurring: boolean;
    stripePaymentIntentId: string;
    stripeChargeId?: string;
    receiptUrl?: string;
    createdAt: Date;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent');

    if (!paymentIntentId) {
        return NextResponse.json(
            { error: 'Payment intent ID is required' },
            { status: 400 }
        );
    }

    try {
        await connectMongoDB();

        const response = await stripe.paymentIntents.retrieve(paymentIntentId, {
            expand: ['charges'],
        });
        const paymentIntent = response as unknown as PaymentIntentWithCharges;

        if (paymentIntent.status !== 'succeeded') {
            return NextResponse.json(
                { status: paymentIntent.status, error: 'Payment not completed' },
                { status: 400 }
            );
        }

        const charge = paymentIntent.charges?.data[0];
        const metadata = paymentIntent.metadata || {};
        const billingDetails = charge?.billing_details || {};

        const receiptData = {
            donorName: metadata.donorName || billingDetails.name || 'Anonymous',
            donorEmail: metadata.donorEmail || billingDetails.email || paymentIntent.receipt_email || '',
            donorPhone: metadata.donorPhone || billingDetails.phone || '',
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency.toUpperCase(),
            donationType: metadata.donationType || 'General Donation',
            paymentMethod: getPaymentMethodDescription(charge),
            receiptUrl: charge?.receipt_url || '',
            created: new Date(paymentIntent.created * 1000),
            isRecurring: false,
        };

        if (!receiptData.donorEmail) {
            return NextResponse.json(
                { error: 'Email is required for donation processing' },
                { status: 400 }
            );
        }

        const existingDonation = await Donation.findOne<DonationDocument>({
            stripePaymentIntentId: paymentIntent.id
        }).lean();

        if (existingDonation) {
            return NextResponse.json({
                status: 'succeeded',
                message: 'Donation already processed',
                donation: existingDonation,
            });
        }

        const donor = await Donor.findOneAndUpdate<DonorDocument>(
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
        );

        const newDonation = await Donation.create<DonationDocument>({
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
        });

        try {
            await sendDonationEmail({
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
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
        }

        return NextResponse.json({
            status: 'succeeded',
            donation: newDonation,
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Payment verification failed';
        return NextResponse.json(
            { status: 'error', error: message },
            { status: 500 }
        );
    }
}

function getPaymentMethodDescription(charge?: Stripe.Charge): string {
    if (!charge?.payment_method_details?.card) return 'card';

    const card = charge.payment_method_details.card;
    const brand = card.brand || 'card';
    const last4 = card.last4 || '••••';

    return `${brand.toUpperCase()} •••• ${last4}`;
}