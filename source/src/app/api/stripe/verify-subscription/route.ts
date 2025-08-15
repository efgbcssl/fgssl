/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { connectMongoDB } from '@/lib/mongodb';
import Donor from '@/models/Donor';
import Donation from '@/models/Donation';
import { sendSubscriptionConfirmationEmail } from '@/lib/email';
import { generateUnsubscribeLink } from '@/lib/helper';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-05-28.basil',
});

interface SubscriptionConfirmationEmailData {
    to: string;
    donorName: string;
    amount: number;
    currency: string;
    frequency: string;
    donationType: string;
    subscriptionId: string;
    nextBillingDate: Date;
    manageSubscriptionUrl: string;
    unsubscribeUrl: string;
}

interface ExpandedInvoice extends Stripe.Invoice {
    payment_intent?: Stripe.PaymentIntent;
}

interface ExpandedSubscription extends Omit<Stripe.Subscription, 'customer' | 'latest_invoice'> {
    latest_invoice?: ExpandedInvoice | string;
    customer?: Stripe.Customer | Stripe.DeletedCustomer | string;
    current_period_end: number;
    id: string
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscription_id');

    console.log('🔵 [VERIFY-SUBSCRIPTION] Starting verification for:', subscriptionId);

    if (!subscriptionId) {
        console.log('🔴 Missing subscription_id parameter');
        return NextResponse.json(
            { status: 'missing_params', error: 'Subscription ID is required' },
            { status: 400 }
        );
    }

    try {
        await connectMongoDB();
        console.log('🔗 MongoDB connected successfully');

        console.log('🔵 Retrieving subscription from Stripe...');
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ['latest_invoice', 'latest_invoice.payment_intent', 'customer']
        }) as unknown as ExpandedSubscription;

        console.log('ℹ️ Subscription status:', subscription.status);

        if (subscription.status === 'active' || subscription.status === 'trialing') {
            console.log('🟢 Subscription is active/trialing');
            const formattedResponse = await formatSubscriptionResponse(subscription);

            if (subscription.status === 'active') {
                await handleSubscriptionConfirmation(subscription, formattedResponse.donation);
            }

            return NextResponse.json({
                status: 'succeeded',
                active: true,
                subscription: formattedResponse
            });
        }

        const errorMap: Record<string, { status: number; message: string }> = {
            past_due: { status: 402, message: 'Subscription payment is past due' },
            canceled: { status: 400, message: 'Subscription was canceled' },
            unpaid: { status: 402, message: 'Subscription payment failed' },
            incomplete: { status: 402, message: 'Subscription payment incomplete' },
            incomplete_expired: { status: 400, message: 'Subscription incomplete and expired' }
        };

        const error = errorMap[subscription.status] || {
            status: 400,
            message: `Subscription not active (status: ${subscription.status})`
        };

        console.log(`🔴 Subscription status: ${subscription.status}`);
        return NextResponse.json(
            { status: subscription.status, error: error.message },
            { status: error.status }
        );

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Subscription verification failed';
        console.error('🔴 Verification error:', message);

        if (message.includes('No such subscription')) {
            return NextResponse.json(
                { status: 'not_found', error: 'Subscription not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { status: 'error', error: message },
            { status: 500 }
        );
    }
}

async function formatSubscriptionResponse(subscription: ExpandedSubscription) {
    console.log('🔵 Formatting subscription response...');

    try {
        const invoice = typeof subscription.latest_invoice === 'string'
            ? null
            : subscription.latest_invoice;

        const price = subscription.items.data[0].price;
        const amount = price.unit_amount ? price.unit_amount / 100 :
            (invoice?.amount_paid || invoice?.amount_due || 0) / 100;
        const currency = price.currency?.toUpperCase() ||
            invoice?.currency?.toUpperCase() ||
            'USD';

        // Get customer details
        let customer: Stripe.Customer | Stripe.DeletedCustomer;
        if (typeof subscription.customer === 'string') {
            customer = await stripe.customers.retrieve(subscription.customer);
        } else {
            customer = subscription.customer as Stripe.Customer | Stripe.DeletedCustomer;
        }

        // Get payment method description
        let paymentMethod = 'card';
        const paymentIntent = invoice?.payment_intent;
        if (paymentIntent?.payment_method && typeof paymentIntent.payment_method === 'string') {
            const method = await stripe.paymentMethods.retrieve(paymentIntent.payment_method);
            if (method.card) {
                paymentMethod = `${method.card.brand || 'card'} •••• ${method.card.last4 || '••••'}`;
            }
        }

        // Get frequency
        const frequency = subscription.metadata?.frequency ||
            price.recurring?.interval ||
            'monthly';

        const donorEmail = subscription.metadata?.donorEmail ||
            (customer.deleted ? '' : (customer as Stripe.Customer).email) ||
            '';

        const donorName = subscription.metadata?.donorName ||
            (customer.deleted ? 'Deleted Customer' : (customer as Stripe.Customer).name) ||
            'Recurring Donor';

        return {
            status: 'succeeded',
            active: true,
            donation: {
                donorName,
                donorEmail,
                donorPhone: subscription.metadata?.donorPhone ||
                    (customer.deleted ? '' : (customer as Stripe.Customer).phone) || '',
                amount,
                currency,
                donationType: subscription.metadata?.donationType || 'Recurring Donation',
                paymentMethod,
                receiptUrl: invoice?.hosted_invoice_url || '',
                created: new Date(subscription.created * 1000),
                frequency,
                isRecurring: true,
                subscriptionId: subscription.id,
                originalAmount: subscription.metadata?.amount ?
                    Number(subscription.metadata.amount) / 100 : amount
            }
        };
    } catch (error) {
        console.error('🔴 Error formatting subscription response:', error);
        throw error;
    }
}

async function handleSubscriptionConfirmation(
    subscription: ExpandedSubscription,
    donationData: {
        donorName: string;
        donorEmail: string;
        donorPhone: string
        amount: number;
        currency: string;
        frequency: string;
        donationType: string;
        subscriptionId: string;
        paymentMethod: string;
    }
) {
    try {
        // First check if we already processed this subscription
        const existingDonation = await Donation.findOne({
            subscriptionId: subscription.id
        });

        if (existingDonation) {
            console.log('ℹ️ Subscription already processed, skipping email');
            return;
        }

        // 1. Create or update the donor record
        const donor = await Donor.findOneAndUpdate(
            { email: donationData.donorEmail },
            {
                $set: {
                    name: donationData.donorName,
                    phone: donationData.donorPhone || '',
                    lastDonationDate: new Date(),
                    donationFrequency: donationData.frequency,
                    hasActiveSubscription: true,
                    stripeCustomerId: typeof subscription.customer === 'string'
                        ? subscription.customer
                        : (subscription.customer as Stripe.Customer)?.id,
                    activeSubscriptionId: subscription.id,
                    subscriptionStatus: 'active',
                    subscriptionStartDate: new Date(),
                    lastUpdated: new Date()
                },
                $inc: { totalDonations: donationData.amount },
                $setOnInsert: {
                    donorsId: crypto.randomUUID(),
                    createdAt: new Date()
                }
            },
            { upsert: true, new: true }
        );

        console.log('✅ Donor record processed:', donor.email);

        // 2. Create the donation record
        const newDonation = await Donation.create({
            donorsId: donor.donorsId || donor._id.toString(),
            amount: donationData.amount,
            currency: donationData.currency,
            donationType: donationData.donationType,
            donorName: donationData.donorName,
            donorEmail: donationData.donorEmail,
            donorPhone: donationData.donorPhone || '',
            isRecurring: true, // Since this is a subscription
            paymentStatus: subscription.status, // Use the subscription status
            paymentMethod: donationData.paymentMethod, // Pass the payment method
            subscriptionId: subscription.id, // Include subscription ID
            frequency: donationData.frequency // Include frequency if needed
        });

        console.log('✅ Saved new subscription donation:', newDonation._id);

        // 3. Send confirmation email
        const unsubscribeUrl = await generateUnsubscribeLink(
            subscription.id,
            donationData.donorEmail
        );

        const emailData: SubscriptionConfirmationEmailData = {
            to: donationData.donorEmail,
            donorName: donationData.donorName,
            amount: donationData.amount,
            currency: donationData.currency,
            frequency: donationData.frequency,
            donationType: donationData.donationType,
            subscriptionId: subscription.id,
            nextBillingDate: new Date(subscription.current_period_end * 1000),
            manageSubscriptionUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/donations/manage`,
            unsubscribeUrl
        };

        await sendSubscriptionConfirmationEmail(emailData);
        console.log('✉️ Subscription confirmation email sent to:', donationData.donorEmail);

    } catch (error) {
        console.error('❌ Failed to process subscription confirmation:', error);
    }
}