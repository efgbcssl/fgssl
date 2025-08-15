/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { connectMongoDB } from '@/lib/mongodb';
import Donor from '@/models/Donor';
import Donation from '@/models/Donation';
import { sendSubscriptionConfirmationEmail } from '@/lib/email';
import { generateUnsubscribeLink } from '@/lib/helper';

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
        // Connect to MongoDB
        await connectMongoDB();
        console.log('🔗 MongoDB connected successfully');

        console.log('🔵 Retrieving subscription from Stripe...');
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: [
                'latest_invoice',
                'latest_invoice.payment_intent',
                'latest_invoice.payment_intent.charges.data',
                'customer'
            ]
        });

        console.log('ℹ️ Subscription status:', subscription.status);

        if (subscription.status === 'active' || subscription.status === 'trialing') {
            console.log('🟢 Subscription is active/trialing');
            const formattedResponse = await formatSubscriptionResponse(subscription);

            // Send confirmation email if this is a new subscription
            if (subscription.status === 'active') {
                await handleSubscriptionConfirmation(subscription, formattedResponse.donation);
            }

            return NextResponse.json({
                status: 'succeeded',
                active: true,
                subscription: formattedResponse
            });
        }

        // Handle other statuses
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

async function formatSubscriptionResponse(subscription: Stripe.Subscription) {
    console.log('🔵 Formatting subscription response...');

    try {
        const invoice = subscription.latest_invoice as Stripe.Invoice | null;
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
        const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent | undefined;
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
            (customer as Stripe.Customer)?.email ||
            '';

        const donorName = subscription.metadata?.donorName ||
            (customer as Stripe.Customer)?.name ||
            'Recurring Donor';

        return {
            status: 'succeeded',
            active: true,
            donation: {
                donorName,
                donorEmail,
                donorPhone: subscription.metadata?.donorPhone || (customer as Stripe.Customer)?.phone || '',
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
    subscription: Stripe.Subscription,
    donationData: {
        donorName: string;
        donorEmail: string;
        amount: number;
        currency: string;
        frequency: string;
        donationType: string;
        subscriptionId: string;
    }
) {
    try {
        // Check if we've already processed this subscription
        const existingDonation = await Donation.findOne({
            subscriptionId: subscription.id
        });

        if (existingDonation) {
            console.log('ℹ️ Subscription already processed, skipping email');
            return;
        }

        // Generate unsubscribe link
        const unsubscribeLink = await generateUnsubscribeLink(
            subscription.id,
            donationData.donorEmail
        );

        // Prepare email data
        const emailData: SubscriptionConfirmationEmailData = {
            to: donationData.donorEmail,
            donorName: donationData.donorName,
            amount: donationData.amount,
            currency: donationData.currency,
            frequency: donationData.frequency,
            donationType: donationData.donationType,
            subscriptionId: subscription.id,
            nextBillingDate: new Date((subscription as any).current_period_end * 1000),
            manageSubscriptionUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/donations/manage`,
            unsubscribeUrl: unsubscribeLink
        };

        // Save to database
        const newDonation = await Donation.create({
            donorsId: randomUUID(),
            amount: donationData.amount,
            currency: donationData.currency,
            donationType: donationData.donationType,
            donorName: donationData.donorName,
            donorEmail: donationData.donorEmail,
            paymentMethod: 'card', // Will be updated from payment intent
            paymentStatus: 'succeeded',
            isRecurring: true,
            subscriptionId: subscription.id,
            frequency: donationData.frequency,
            createdAt: new Date(subscription.created * 1000)
        });

        console.log('✅ Saved new subscription donation:', newDonation._id);

        // Send confirmation email
        await sendSubscriptionConfirmationEmail(emailData);
        console.log('✉️ Subscription confirmation email sent to:', donationData.donorEmail);

    } catch (error) {
        console.error('❌ Failed to process subscription confirmation:', error);
        // Don't fail the whole request if email fails
    }
}

function randomUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}