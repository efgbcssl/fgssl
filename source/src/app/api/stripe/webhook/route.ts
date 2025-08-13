/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { randomUUID } from 'crypto';

import { connectMongoDB } from '@/lib/mongodb';
import Donor from '@/models/Donor';
import Donation from '@/models/Donation';
import FailedPayment from '@/models/FailedPayment';
import SubscriptionCancellation from '@/models/SubscriptionCancellation';

import {
  sendDonationEmail,
  sendPaymentFailedEmail,
  sendSubscriptionConfirmationEmail,
  sendSubscriptionUpdateEmail,
  sendSubscriptionCancellationEmail
} from '@/lib/email';
import { generateUnsubscribeLink } from '@/lib/helper';
import { createExpiringToken } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Type definitions reflecting your original structure
interface DonorRecord {
  donorsId?: string | null
  name?: string
  email: string
  phone?: string | null
  totalDonations?: number
  lastDonationDate?: Date
  donationFrequency?: string | null
  hasActiveSubscription?: boolean
  stripeCustomerId?: string | null
  activeSubscriptionId?: string | null
  subscriptionStartDate?: Date | null
  subscriptionStatus?: string | null
  subscriptionCancelledAt?: Date | null
  lastUpdated: Date | null | undefined
}

interface DonationRecord {
  donorsId?: string | null
  amount: number
  currency: string
  donationType: string
  frequency?: string | null
  donorName: string
  donorEmail: string
  donorPhone?: string | null
  paymentMethod: string
  paymentStatus: string
  isRecurring: boolean
  stripePaymentIntentId?: string
  stripeChargeId?: string | null
  stripeSubscriptionId?: string | null
  stripeInvoiceId?: string | null;
  receiptUrl?: string | null
}

interface FailedPaymentRecord {
  xata_id?: string
  customerEmail: string
  customerName: string
  amount: number
  currency: string
  invoiceId: string
  subscriptionId?: string | null
  failureReason: string
  nextRetryDate?: Date | null
  isRecurring: boolean
  createdAt: Date
  resolved?: boolean
  resolvedAt?: Date | null
}

interface SubscriptionCancellationRecord {
  xata_id?: string
  subscriptionId: string
  customerEmail: string
  customerName: string
  amount: number
  currency: string
  frequency: string
  cancelledAt: Date
  cancellationReason?: string
  totalDonationsBeforeCancellation: number
  voluntaryCancellation?: boolean
}

type PaymentMethodType = 'card' | 'bank' | 'other';

export async function POST(req: Request) {
  console.log('🔵 [WEBHOOK] Received webhook request');

  const signature = (await headers()).get('stripe-signature') as string;
  console.log('🔵 [WEBHOOK] Stripe signature exists:', !!signature);
  console.log('🔵 [WEBHOOK] Endpoint secret exists:', !!endpointSecret);

  const body = await req.text();
  console.log('🔵 [WEBHOOK] Raw body length:', body.length);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret) as Stripe.Event;
    console.log(`🟢 Webhook verified - Type: ${event.type}, ID: ${event.id}`);
  } catch (err) {
    console.error('🔴 Webhook verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Ensure DB is connected for all subsequent operations
  try {
    await connectMongoDB();
    console.log('🔗 MongoDB connected successfully');
  } catch (dbError) {
    console.error('❌ MongoDB connection failed:', dbError);
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        return await handlePaymentIntentSucceeded(event);
      case 'invoice.payment_succeeded':
        return await handleInvoicePaymentSucceeded(event);
      case 'invoice.payment_failed':
        return await handlePaymentFailed(event);
      case 'customer.subscription.created':
        return await handleSubscriptionCreated(event);
      case 'customer.subscription.updated':
        return await handleSubscriptionUpdated(event);
      case 'customer.subscription.deleted':
        return await handleSubscriptionDeleted(event);
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
        return NextResponse.json({ received: true });
    }
  } catch (error) {
    console.error('🔥 Webhook processing error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}

// Helpers
function getPaymentMethodDetails(charge: Stripe.Charge | null): {
  type: PaymentMethodType
  description: string
} {
  if (!charge) return { type: 'card', description: 'Card' };
  const details = charge.payment_method_details;
  if (!details) return { type: 'card', description: 'Card' };

  if (details.card) {
    return {
      type: 'card',
      description: `${details.card.brand?.toUpperCase()} •••• ${details.card.last4}`
    };
  }
  return { type: 'other', description: (details as any).type || 'Unknown' };
}

async function saveDonationRecord(data: {
  donorsId: string | null
  email: string
  name: string
  phone?: string | undefined
  amount: number
  currency: string
  donationType: string
  frequency?: string
  paymentMethod: string
  isRecurring: boolean
  stripePaymentIntentId?: string
  stripeChargeId?: string
  stripeSubscriptionId?: string
  stripeInvoiceId?: string
  receiptUrl?: string
  created: Date
}): Promise<{ donor: DonorRecord; donation: DonationRecord }> {
  console.log('💾 Starting saveDonationRecord for:', data.email);

  // Check for existing donation to prevent duplicates
  if (data.stripeInvoiceId) {
    const existing = await Donation.findOne({ stripeInvoiceId: data.stripeInvoiceId }).lean();
    if (existing) {
      console.log('🟨 Donation already exists for invoice:', data.stripeInvoiceId);
      const donor = await Donor.findOne({ email: data.email }).lean();
      return {
        donor: donor as unknown as DonorRecord,
        donation: existing as unknown as DonationRecord,
      }
    }
  }

  // Check for existing PaymentIntent to prevent duplicates
  if (data.stripePaymentIntentId && !data.isRecurring) {
    const existing = await Donation.findOne({ stripePaymentIntentId: data.stripePaymentIntentId }).lean();
    if (existing) {
      console.log('🟨 Donation already exists for PaymentIntent:', data.stripePaymentIntentId);
      const donor = await Donor.findOne({ email: data.email }).lean();
      return {
        donor: donor as unknown as DonorRecord,
        donation: existing as unknown as DonationRecord,
      }
    }
  }

  console.log('💾 Saving new donation record:', {
    donorsId: data.donorsId,
    email: data.email,
    amount: data.amount,
    type: data.donationType,
    isRecurring: data.isRecurring
  });

  const lastDonationDate = data.created;

  // Find existing donor or prepare to create new one
  let donorDoc = await Donor.findOne({ email: data.email });
  let donorsId = data.donorsId;

  if (!donorsId) {
    donorsId = donorDoc?.donorsId || randomUUID();
  }

  const baseUpdate: Partial<DonorRecord> = {
    donorsId,
    name: data.name,
    phone: data.phone,
    lastDonationDate,
    donationFrequency: data.frequency || (data.isRecurring ? 'monthly' : 'one-time'),
    lastUpdated: new Date(),
  };

  // Update subscription-related fields for recurring donations
  if (data.isRecurring && data.stripeSubscriptionId) {
    baseUpdate.hasActiveSubscription = true;
    baseUpdate.activeSubscriptionId = data.stripeSubscriptionId;
    baseUpdate.subscriptionStatus = 'active';
    if (!donorDoc?.activeSubscriptionId) {
      baseUpdate.subscriptionStartDate = data.created;
    }
  }

  // Update or create donor record
  if (donorDoc) {
    donorDoc.totalDonations = (donorDoc.totalDonations || 0) + data.amount;
    Object.assign(donorDoc, baseUpdate);
    await donorDoc.save();
    console.log('✅ Updated existing donor:', donorDoc.email);
  } else {
    donorDoc = await Donor.create({
      email: data.email,
      totalDonations: data.amount,
      stripeCustomerId: null,
      ...baseUpdate,
    });
    console.log('✅ Created new donor:', donorDoc.email);
  }

  // Create donation record
  const donationDoc = await Donation.create({
    donorsId: donorDoc.donorsId ?? donorsId,
    amount: data.amount,
    currency: data.currency,
    donationType: data.donationType,
    frequency: data.isRecurring ? (data.frequency || 'monthly') : 'one-time',
    donorName: data.name,
    donorEmail: data.email,
    donorPhone: data.phone,
    paymentMethod: data.paymentMethod,
    paymentStatus: 'succeeded',
    isRecurring: data.isRecurring,
    stripePaymentIntentId: data.stripePaymentIntentId,
    stripeChargeId: data.stripeChargeId,
    stripeSubscriptionId: data.isRecurring ? data.stripeSubscriptionId : undefined,
    stripeInvoiceId: data.stripeInvoiceId ?? undefined,
    receiptUrl: data.receiptUrl,
    createdAt: data.created,
  });

  console.log('✅ Created donation record:', donationDoc._id);

  return {
    donor: donorDoc.toObject() as DonorRecord,
    donation: donationDoc.toObject() as DonationRecord,
  };
}

// Event handlers
async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  console.log('💳 PaymentIntent succeeded:', paymentIntent.id);

  // Skip subscription payments (handled by invoice webhook)
  if (paymentIntent.metadata?.subscriptionId || (paymentIntent as any).invoice) {
    console.log('⏭️ Skipping subscription payment - handled by invoice webhook');
    return NextResponse.json({ received: true });
  }

  try {
    // Get charge details
    let charge: Stripe.Charge | null = null;
    if (paymentIntent.latest_charge) {
      const chargeId = typeof paymentIntent.latest_charge === 'string'
        ? paymentIntent.latest_charge
        : paymentIntent.latest_charge.id;
      charge = await stripe.charges.retrieve(chargeId);
      console.log('💳 Retrieved charge details:', charge.id);
    }

    const paymentMethod = getPaymentMethodDetails(charge);
    const metadata = paymentIntent.metadata || {};

    const donorEmail = metadata.donorEmail || charge?.billing_details?.email || '';
    if (!donorEmail) {
      console.error('❌ Missing donor email for PI:', paymentIntent.id);
      return NextResponse.json({ error: 'Missing donor email' }, { status: 400 });
    }

    // Prepare donor data
    const donorData = {
      donorsId: metadata.donorsId || randomUUID(),
      name: metadata.donorName || charge?.billing_details?.name || 'Anonymous',
      email: donorEmail,
      phone: metadata.donorPhone || charge?.billing_details?.phone || undefined,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      donationType: metadata.donationType || 'General Donation',
      frequency: 'one-time',
      paymentMethod: paymentMethod.description,
      isRecurring: false,
      stripePaymentIntentId: paymentIntent.id,
      stripeChargeId: charge?.id,
      receiptUrl: charge?.receipt_url || '',
      created: new Date(paymentIntent.created * 1000)
    };

    console.log('💾 Processing one-time donation for:', donorEmail);
    const { donation } = await saveDonationRecord(donorData);
    console.log('✅ Saved one-time donation:', donation?._id || donation?.donorsId);

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
        isRecurring: false
      });
      console.log('✉️ Sent one-time donation confirmation email to:', donorData.email);
    } catch (emailError) {
      console.error('❌ Failed to send donation email:', emailError);
      // Don't fail the webhook for email issues
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Failed to process payment intent:', error);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}

async function handleInvoicePaymentSucceeded(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  console.log('📄 Invoice payment succeeded:', invoice.id);

  const subscriptionId = (invoice as any).subscription as string | undefined;
  if (!subscriptionId) {
    console.log('⏭️ Skipping non-subscription invoice');
    return NextResponse.json({ received: true });
  }

  try {
    // Check if this donation was already processed
    const existing = await Donation.findOne({ stripeInvoiceId: invoice.id }).lean();
    if (existing) {
      console.log('🟨 Donation already recorded for invoice:', invoice.id);
      return NextResponse.json({ received: true });
    }

    // Retrieve subscription and customer details
    const [subscription, customer] = await Promise.all([
      stripe.subscriptions.retrieve(subscriptionId as string),
      stripe.customers.retrieve(invoice.customer as string)
    ]);

    if (typeof customer === 'string' || (customer as any).deleted) {
      console.error('❌ Customer not found or deleted');
      return NextResponse.json({ error: 'Customer not found' }, { status: 400 });
    }

    // Extract customer information with fallbacks
    let customerEmail = '';
    let customerName = 'Recurring Donor';

    if (customer && !('deleted' in customer)) {
      customerEmail = customer.email || invoice.customer_email || subscription.metadata?.email || '';
      customerName = customer.name || subscription.metadata?.donorName || 'Recurring Donor';
    }

    console.log('📧 Resolved customer email:', customerEmail);
    console.log('👤 Resolved customer name:', customerName);

    if (!customerEmail) {
      console.error('❌ Missing customer email for invoice:', invoice.id);
      return NextResponse.json({ error: 'Missing customer email' }, { status: 400 });
    }

    // Get payment method details
    const paymentIntentId = (invoice as any).payment_intent as string | undefined;
    let paymentMethod = 'Card';

    if (paymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.latest_charge) {
          const chargeId = typeof paymentIntent.latest_charge === 'string'
            ? paymentIntent.latest_charge
            : paymentIntent.latest_charge.id;
          const charge = await stripe.charges.retrieve(chargeId);
          paymentMethod = getPaymentMethodDetails(charge).description;
        }
      } catch (pmError) {
        console.warn('⚠️ Could not retrieve payment method details:', pmError);
      }
    }

    // Extract subscription details
    const item = subscription.items.data[0];
    const frequency = subscription.metadata?.frequency ||
      ((item?.price?.recurring?.interval || 'month') + 'ly');

    const donationData = {
      donorsId: subscription.metadata?.donorsId || null,
      email: customerEmail,
      name: customerName,
      phone: (customer as any)?.phone ?? undefined,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency.toUpperCase(),
      donationType: subscription.metadata?.donationType || 'Recurring Donation',
      frequency,
      paymentMethod,
      isRecurring: true,
      stripePaymentIntentId: paymentIntentId,
      stripeSubscriptionId: subscription.id,
      stripeChargeId: (invoice as any).charge as string | undefined,
      stripeInvoiceId: invoice.id,
      receiptUrl: invoice.hosted_invoice_url || '',
      created: new Date(invoice.created * 1000)
    };

    // Save donation record
    try {
      console.log('💾 Processing recurring donation for:', customerEmail);
      const { donation } = await saveDonationRecord(donationData);
      console.log('✅ Saved recurring donation:', donation?._id || donation?.donorsId);
    } catch (saveError) {
      console.error('❌ Failed to save donation record:', saveError);
      throw saveError; // Re-throw to prevent email sending if DB save fails
    }

    // Send donation confirmation email
    try {
      await sendDonationEmail({
        to: customerEmail,
        donorName: customerName,
        amount: donationData.amount,
        donationType: donationData.donationType,
        currency: donationData.currency,
        frequency: donationData.frequency,
        createdDate: donationData.created,
        paymentMethod: donationData.paymentMethod,
        receiptUrl: donationData.receiptUrl,
        isRecurring: true
      });
      console.log('✉️ Sent recurring donation email to:', customerEmail);
    } catch (emailError) {
      console.error('❌ Failed to send donation email:', emailError);
      // Don't fail the webhook for email issues
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Failed to process invoice:', error);
    return NextResponse.json({ error: 'Failed to process invoice' }, { status: 500 });
  }
}

async function handlePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  console.log('⚠️ Invoice payment failed:', invoice.id);

  try {
    if (!invoice.customer) {
      console.error('❌ Failed payment invoice missing customer:', invoice.id);
      return NextResponse.json({ received: true });
    }

    const customer = await stripe.customers.retrieve(invoice.customer as string);
    if (!customer || typeof customer !== 'object' || (customer as any).deleted) {
      console.warn('⚠️ Customer not found for failed payment:', invoice.customer);
      return NextResponse.json({ received: true });
    }

    const customerEmail = (customer as any).email as string | undefined;
    const customerName = ((customer as any).name as string | undefined) || 'Donor';

    if (!customerEmail) {
      console.warn('⚠️ No email found for failed payment customer:', invoice.customer);
      return NextResponse.json({ received: true });
    }

    const isRecurring = !!(invoice as any).subscription;
    const subscriptionId = ((invoice as any).subscription as string) || null;

    // Get subscription details if recurring
    let subscriptionStatus: string | null = null;
    let cancelAtPeriodEnd = false;
    if (isRecurring && subscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        subscriptionStatus = subscription.status;
        cancelAtPeriodEnd = subscription.cancel_at_period_end;
      } catch (error) {
        console.error('❌ Failed to retrieve subscription:', error);
      }
    }

    const failureReason = invoice.billing_reason || 'payment_failed';
    const nextRetryDate = invoice.next_payment_attempt
      ? new Date(invoice.next_payment_attempt * 1000)
      : null;

    // Send payment failure email
    try {
      await sendPaymentFailedEmail({
        to: customerEmail,
        donorName: customerName,
        invoiceId: invoice.number || invoice.id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency.toUpperCase(),
        hostedInvoiceUrl: invoice.hosted_invoice_url || '',
        nextRetryDate,
        updatePaymentUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/donations/update-payment?customer_id=${invoice.customer}`,
        billingReason: failureReason,
        isRecurring,
        subscriptionStatus,
        willRetry: !!nextRetryDate
      });
      console.log(`✉️ Sent ${isRecurring ? 'recurring' : 'one-time'} payment failure email to:`, customerEmail);
    } catch (emailError) {
      console.error('❌ Failed to send payment failure email:', emailError);
    }

    // Log failed payment attempt in MongoDB
    try {
      await FailedPayment.create({
        customerEmail,
        customerName,
        amount: invoice.amount_due / 100,
        currency: invoice.currency.toUpperCase(),
        invoiceId: invoice.id,
        subscriptionId,
        failureReason,
        nextRetryDate,
        isRecurring,
        createdAt: new Date(),
        resolved: false
      });
      console.log('📝 Logged failed payment to database');
    } catch (dbError) {
      console.warn('⚠️ Could not log failed payment to database:', dbError);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Failed to handle payment failure:', error);
    return NextResponse.json({ received: true });
  }
}

async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  console.log('🆕 Subscription created:', subscription.id);

  try {
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    if (!customer || typeof customer !== 'object' || (customer as any).deleted) {
      console.error('❌ Customer not found for new subscription:', subscription.customer);
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const customerEmail = (customer as any).email ||
      subscription.metadata?.email || '';
    const customerName = (customer as any).name ||
      subscription.metadata?.donorName || 'Donor';

    if (!customerEmail) {
      console.error('❌ Missing customer email for subscription:', subscription.id);
      return NextResponse.json({ error: 'Missing customer email' }, { status: 400 });
    }

    const firstItem = subscription.items.data[0];
    const amount = (firstItem?.price?.unit_amount || 0) / 100;
    const currency = firstItem?.price?.currency?.toUpperCase() || 'USD';
    const interval = firstItem?.price?.recurring?.interval || 'month';
    const frequency = `${interval}ly`;

    // Update donor record
    try {
      let donor = await Donor.findOne({ email: customerEmail });

      const update = {
        email: customerEmail,
        name: customerName,
        phone: (customer as any).phone ?? undefined,
        donationFrequency: frequency,
        hasActiveSubscription: true,
        stripeCustomerId: (customer as any).id as string,
        activeSubscriptionId: subscription.id,
        subscriptionStartDate: new Date(subscription.created * 1000),
        subscriptionStatus: subscription.status,
        lastUpdated: new Date()
      };

      if (donor) {
        Object.assign(donor, update);
        await donor.save();
        console.log('✅ Updated donor record for subscription');
      } else {
        donor = await Donor.create({
          ...update,
          donorsId: randomUUID(),
          totalDonations: 0
        });
        console.log('✅ Created new donor record for subscription');
      }
    } catch (dbError) {
      console.error('❌ Failed to update donor record:', dbError);
    }

    // Send subscription confirmation email
    try {
      const unsubscribeLink = await generateUnsubscribeLink(subscription.id, customerEmail);

      await sendSubscriptionConfirmationEmail({
        to: customerEmail,
        donorName: customerName,
        amount,
        currency,
        frequency,
        donationType: subscription.metadata?.donationType || 'Recurring Donation',
        subscriptionId: subscription.id,
        nextBillingDate: new Date((subscription as any).current_period_end * 1000),
        manageSubscriptionUrl: unsubscribeLink,
        unsubscribeUrl: unsubscribeLink
      });

      console.log('✉️ Sent subscription confirmation email to:', customerEmail);
    } catch (emailError) {
      console.error('❌ Failed to send subscription confirmation email:', emailError);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Failed to handle subscription creation:', error);
    return NextResponse.json({ error: 'Failed to process subscription creation' }, { status: 500 });
  }
}

async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const previousAttributes = event.data.previous_attributes as Partial<Stripe.Subscription>;
  console.log('🔄 Subscription updated:', subscription.id);

  try {
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    if (!customer || typeof customer !== 'object' || (customer as any).deleted) {
      console.warn('⚠️ Customer not found for subscription update:', subscription.customer);
      return NextResponse.json({ received: true });
    }

    const customerEmail = (customer as any).email as string | undefined;
    const customerName = ((customer as any).name as string | undefined) || 'Donor';

    if (!customerEmail) {
      console.warn('⚠️ No email for subscription update:', subscription.id);
      return NextResponse.json({ received: true });
    }

    const changes: string[] = [];
    const currentItem = subscription.items.data[0];
    const currentAmount = (currentItem?.price?.unit_amount || 0) / 100;
    const currentCurrency = currentItem?.price?.currency?.toUpperCase() || 'USD';
    const currentInterval = currentItem?.price?.recurring?.interval || 'month';

    // Track changes
    if (previousAttributes.items) {
      const previousAmount = (previousAttributes.items.data?.[0]?.price?.unit_amount || 0) / 100;
      if (previousAmount !== currentAmount) {
        changes.push(`Amount changed from $${previousAmount} to $${currentAmount}`);
      }
    }

    if (previousAttributes.status && previousAttributes.status !== subscription.status) {
      changes.push(`Status changed from ${previousAttributes.status} to ${subscription.status}`);
    }

    if (subscription.cancel_at_period_end && !previousAttributes.cancel_at_period_end) {
      changes.push('Subscription scheduled for cancellation at period end');
    } else if (!subscription.cancel_at_period_end && previousAttributes.cancel_at_period_end) {
      changes.push('Subscription cancellation was cancelled - will continue');
    }

    // Update donor record
    try {
      const donor = await Donor.findOne({ email: customerEmail });
      if (donor) {
        donor.donationFrequency = `${currentInterval}ly`;
        donor.hasActiveSubscription = subscription.status === 'active';
        donor.subscriptionStatus = subscription.status;
        donor.lastUpdated = new Date();
        await donor.save();
        console.log('✅ Updated donor record for subscription change');
      }
    } catch (dbError) {
      console.error('❌ Failed to update donor record:', dbError);
    }

    // Send update notification if there are significant changes
    if (changes.length > 0) {
      try {
        await sendSubscriptionUpdateEmail({
          to: customerEmail,
          donorName: customerName,
          subscriptionId: subscription.id,
          changes,
          currentAmount,
          currency: currentCurrency,
          frequency: `${currentInterval}ly`,
          nextBillingDate: new Date((subscription as any).current_period_end * 1000),
          subscriptionStatus: subscription.status,
          manageSubscriptionUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/donations/manage?customer_id=${(customer as any).id}`
        });
        console.log('✉️ Sent subscription update email to:', customerEmail);
      } catch (emailError) {
        console.error('❌ Failed to send subscription update email:', emailError);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Failed to handle subscription update:', error);
    return NextResponse.json({ received: true });
  }
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  console.log('🗑️ Subscription cancelled:', subscription.id);

  try {
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    if (!customer || typeof customer !== 'object' || (customer as any).deleted) {
      console.warn('⚠️ Customer not found for cancelled subscription:', subscription.customer);
      return NextResponse.json({ received: true });
    }

    const customerEmail = (customer as any).email as string | undefined;
    const customerName = ((customer as any).name as string | undefined) || 'Donor';

    if (!customerEmail) {
      console.warn('⚠️ No email for cancelled subscription:', subscription.id);
      return NextResponse.json({ received: true });
    }

    const priceItem = subscription.items.data[0];
    const amount = (priceItem?.price?.unit_amount || 0) / 100;
    const currency = priceItem?.price?.currency?.toUpperCase() || 'USD';
    const frequency = `${priceItem?.price?.recurring?.interval || 'month'}ly`;
    const cancelledAt = new Date(subscription.canceled_at ? subscription.canceled_at * 1000 : Date.now());

    // Update donor record
    let donor;
    try {
      donor = await Donor.findOne({ email: customerEmail });
      if (donor) {
        donor.hasActiveSubscription = false;
        donor.subscriptionStatus = 'cancelled';
        donor.subscriptionCancelledAt = cancelledAt;
        donor.activeSubscriptionId = null;
        donor.donationFrequency = 'one-time';
        donor.lastUpdated = new Date();
        await donor.save();
        console.log('✅ Updated donor record for cancellation');
      }
    } catch (dbError) {
      console.error('❌ Failed to update donor record:', dbError);
    }

    // Log cancellation to database
    try {
      await SubscriptionCancellation.create({
        subscriptionId: subscription.id,
        customerEmail,
        customerName,
        amount,
        currency,
        frequency,
        cancelledAt,
        cancellationReason: (subscription as any).cancellation_details?.reason || 'user_requested',
        totalDonationsBeforeCancellation: donor?.totalDonations || 0,
        voluntaryCancellation: (subscription as any).cancellation_details?.reason !== 'payment_failed',
      });
      console.log('📝 Logged subscription cancellation to database');
    } catch (dbError) {
      console.warn('⚠️ Could not log cancellation to database:', dbError);
    }

    // Send cancellation email
    try {
      await sendSubscriptionCancellationEmail({
        to: customerEmail,
        donorName: customerName,
        subscriptionId: subscription.id,
        amount,
        currency,
        frequency,
        cancelledAt,
        totalContributed: donor?.totalDonations || amount,
        reactivateUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/donate?reactivate=true&email=${encodeURIComponent(customerEmail)}`
      });

      console.log('✉️ Sent subscription cancellation email to:', customerEmail);
    } catch (emailError) {
      console.error('❌ Failed to send cancellation email:', emailError);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Failed to handle subscription cancellation:', error);
    return NextResponse.json({ received: true });
  }
}