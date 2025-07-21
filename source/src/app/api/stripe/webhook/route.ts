/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { headers } from 'next/headers'
import { NextResponse, NextRequest } from 'next/server'
import Stripe from 'stripe'
import { xata } from '@/lib/xata'
import { sendDonationEmail, sendPaymentFailedEmail } from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
})
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

interface DonorRecord {
  xata_id?: string
  name?: string
  email: string
  phone?: string
  totalDonations?: number
  lastDonationDate?: Date | string
  donationFrequency?: string
}

interface DonationRecord {
  xata_id?: string
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
  date: Date | string
}

export async function POST(req: NextRequest) {
  console.log('🔵 [WEBHOOK START] Received webhook request')
  console.log('🔵 Reading request body...')
  const body = await req.text()
  const sig = (await headers()).get('stripe-signature') as string
  console.log('🟢 Request body read successfully')
  console.log('ℹ️ Headers:', { sig })

  if (!sig) {
    console.log('🔴 Missing Stripe signature header')
    return NextResponse.json(
      { error: 'Missing Stripe signature' },
      { status: 400 }
    )
  }

  console.log('🔵 Verifying webhook signature...')
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    console.log('🟢 Webhook signature verified successfully')
    console.log(`ℹ️ Event type: ${event.type}`)
    console.log('ℹ️ Event data:', JSON.stringify(event.data.object, null, 2))
  } catch (err) {
    console.error('🔴 Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  console.log(`🔔 Received event type: ${event.type}`)

  try {
    switch (event.type as string) {
      case 'payment_intent.succeeded':
        return await handlePaymentIntentSucceeded(event)
        break
      case 'invoice.payment_succeeded':
        return await handleInvoicePaymentSucceeded(event)
      case 'customer.subscription.created':
        return await handleSubscriptionCreated(event)
      case 'customer.subscription.updated':
        return await handleSubscriptionUpdated(event)
      case 'customer.subscription.deleted':
        return await handleSubscriptionDeleted(event)
      case 'invoice.payment_failed':
        return await handlePaymentFailed(event)
      case 'invoice.payment_action_required':
        return await handlePaymentActionRequired(event)
      // Additional events for better subscription management
      case 'customer.subscription.past_due':
        return await handleSubscriptionPastDue(event)
      case 'customer.subscription.unpaid':
        return await handleSubscriptionUnpaid(event)
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`)
        return NextResponse.json({ received: true })
    }
  } catch (error) {
    console.error('🔥 Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

// Helper functions for each event type
async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  // Start logging
  console.log('🔵 [PAYMENT_INTENT] Starting payment_intent.succeeded handler');
  console.log('ℹ️ Raw event type:', event.type);
  console.log('ℹ️ Event ID:', event.id);
  console.log('ℹ️ Event livemode:', event.livemode);

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const metadata = paymentIntent.metadata || {};

  console.log('💳 PaymentIntent details:', {
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
    created: new Date(paymentIntent.created * 1000).toISOString()
  });
  console.log('📌 Metadata:', JSON.stringify(metadata, null, 2));

  // Skip if this is a subscription payment
  if (metadata.subscriptionId || (paymentIntent as any).invoice) {
    console.log('⏭️ Skipping subscription payment (handled by invoice webhook)');
    return NextResponse.json({ received: true });
  }

  // Retrieve charge details
  console.log('🔍 Retrieving charge details...');
  let charge: Stripe.Charge | null = null;
  if (paymentIntent.latest_charge) {
    try {
      charge = await stripe.charges.retrieve(
        typeof paymentIntent.latest_charge === 'string'
          ? paymentIntent.latest_charge
          : paymentIntent.latest_charge.id,
        { expand: ['payment_intent'] }
      );
      console.log('⚡ Charge details:', {
        id: charge.id,
        amount: charge.amount,
        receipt_url: charge.receipt_url ? 'available' : 'not available',
        payment_method: charge.payment_method_details?.type
      });
    } catch (err) {
      console.error('⚠️ Failed to retrieve charge:', err);
    }
  } else {
    console.log('ℹ️ No charge details available');
  }

  // Prepare donor data with comprehensive fallbacks
  const donorData = {
    name: metadata.donorName || charge?.billing_details?.name || 'Anonymous',
    email: metadata.donorEmail || charge?.billing_details?.email || '',
    phone: metadata.donorPhone || charge?.billing_details?.phone || '',
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency.toUpperCase(),
    donationType: metadata.donationType || 'General Donation',
    frequency: metadata.frequency || 'one-time',
    paymentMethod: charge ? getPaymentMethodType(charge) : 'card',
    receiptUrl: charge?.receipt_url || '',
    stripeChargeId: charge?.id ?? undefined,
    created: new Date(paymentIntent.created * 1000),
    stripePaymentIntentId: paymentIntent.id,
    isRecurring: false
  };

  console.log('📋 Complete donor data:', JSON.stringify({
    ...donorData,
    phone: donorData.phone ? '****' + donorData.phone.slice(-4) : 'not provided'
  }, null, 2));

  // Validate required fields
  if (!donorData.email) {
    console.error('❌ Missing donor email in payment intent');
    return NextResponse.json(
      { error: 'Missing donor email' },
      { status: 400 }
    );
  }

  if (donorData.amount <= 0) {
    console.error('❌ Invalid amount:', donorData.amount);
    return NextResponse.json(
      { error: 'Invalid donation amount' },
      { status: 400 }
    );
  }

  // Save to database
  console.log('💾 Attempting to save donation record...');
  try {
    const { donor, donation } = await saveDonationRecord(donorData);
    console.log('✅ Database records saved:', {
      donorId: donor?.xata_id,
      donationId: donation?.xata_id,
      amount: donation?.amount,
      type: donation?.donationType
    });

    // Send confirmation email
    if (donorData.email) {
      console.log('📧 Preparing to send confirmation email...');
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
        console.log('✉️ Email sent successfully');
      } catch (emailError) {
        console.error('⚠️ Failed to send email:', emailError);
        // Consider queueing for retry
      }
    }

    console.log(`✅ Successfully processed payment ${paymentIntent.id}`);
    return NextResponse.json({
      received: true,
      processed: true,
      paymentIntentId: paymentIntent.id,
      chargeId: charge?.id,
      amount: donorData.amount,
      currency: donorData.currency
    });
  } catch (dbError) {
    console.error('❌ Database save failed:', dbError);
    return NextResponse.json(
      { error: 'Failed to save donation record' },
      { status: 500 }
    );
  }
}

async function handleInvoicePaymentSucceeded(event: Stripe.Event) {
  console.log('🔵 [INVOICE] Starting invoice payment succeeded handler');
  console.log('ℹ️ Raw event type:', event.type);
  console.log('ℹ️ Event ID:', event.id);

  const invoice = event.data.object as Stripe.Invoice;
  console.log('📄 Invoice details:', {
    id: invoice.id,
    amount_paid: invoice.amount_paid,
    currency: invoice.currency,
    customer_email: invoice.customer_email,
    hosted_invoice_url: invoice.hosted_invoice_url
  });

  const subscriptionId = (invoice as any).subscription as string | null;
  console.log('🔍 Subscription ID from invoice:', subscriptionId);

  if (!subscriptionId) {
    console.log('⏭️ Skipping non-subscription invoice');
    return NextResponse.json({ received: true });
  }

  console.log('🔵 Retrieving subscription and customer details...');
  try {
    const [subscription, customer] = await Promise.all([
      stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price.product']
      }),
      stripe.customers.retrieve(invoice.customer as string)
    ]);

    console.log('✅ Retrieved subscription:', {
      id: subscription.id,
      status: subscription.status,
      metadata: subscription.metadata
    });

    // Process customer details
    let customerEmail = '';
    let customerName = 'Recurring Donor';
    let customerPhone: string | undefined;

    if (customer && typeof customer === 'object' && !('deleted' in customer)) {
      customerEmail = invoice.customer_email || customer.email || '';
      customerName = customer.name || subscription.metadata?.donorName || 'Recurring Donor';
      customerPhone = customer.phone || subscription.metadata?.donorPhone;

      console.log('👤 Customer details:', {
        email: customerEmail,
        name: customerName,
        phone: customerPhone ? '****' + customerPhone.slice(-4) : 'not provided'
      });
    } else if (invoice.customer_email) {
      customerEmail = invoice.customer_email;
      console.log('👤 Using invoice customer email:', customerEmail);
    } else {
      console.error('❌ Missing customer email on invoice');
      return NextResponse.json(
        { error: 'Missing customer email' },
        { status: 400 }
      );
    }

    // Determine payment method
    console.log('💳 Determining payment method...');
    let paymentMethod = 'card';
    const paymentIntentId = (invoice as any).payment_intent as string | undefined;

    if (paymentIntentId) {
      try {
        console.log('🔍 Retrieving payment intent:', paymentIntentId);
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
          expand: ['latest_charge']
        });

        const charge = paymentIntent.latest_charge as Stripe.Charge | null;
        paymentMethod = getPaymentMethodType(charge);
        console.log('✅ Payment method determined:', paymentMethod);
      } catch (err) {
        console.error('⚠️ Failed to retrieve payment method info:', err);
      }
    }

    // Determine frequency
    console.log('🔄 Determining donation frequency...');
    let frequency = subscription.metadata?.frequency;
    if (!frequency && subscription.items.data[0]?.price?.recurring?.interval) {
      frequency = subscription.items.data[0].price.recurring.interval + 'ly';
    }
    frequency = frequency || 'monthly';
    console.log('✅ Frequency:', frequency);

    // Prepare donation data
    const donationData = {
      email: customerEmail,
      name: customerName,
      phone: customerPhone,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency.toUpperCase(),
      donationType: subscription.metadata?.donationType || 'Recurring Donation',
      frequency,
      paymentMethod,
      isRecurring: true,
      stripePaymentIntentId: paymentIntentId,
      stripeSubscriptionId: subscription.id,
      stripeChargeId: typeof (invoice as any).charge === 'string' ? (invoice as any).charge : null,
      receiptUrl: invoice.hosted_invoice_url || '',
      created: new Date(invoice.created * 1000)
    };

    console.log('📋 Complete donation data:', JSON.stringify({
      ...donationData,
      phone: donationData.phone ? '****' + donationData.phone.slice(-4) : null
    }, null, 2));

    // Save to database
    console.log('💾 Saving to database...');
    try {
      const { donor, donation } = await saveDonationRecord(donationData);
      console.log('✅ Database records saved:', {
        donorId: donor?.xata_id,
        donationId: donation?.xata_id
      });

      // Send confirmation email
      if (donationData.email) {
        console.log('📧 Sending confirmation email...');
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
            isRecurring: true,
            unsubscribeLink: `${process.env.NEXT_PUBLIC_SITE_URL}/donations/manage?customer_id=${invoice.customer}`
          });
          console.log('✉️ Email sent successfully');
        } catch (emailError) {
          console.error('❌ Failed to send email:', emailError);
        }
      }

      console.log(`🏁 Successfully processed recurring payment from invoice ${invoice.id}`);
      return NextResponse.json({
        received: true,
        processed: true,
        invoiceId: invoice.id,
        amount: donationData.amount,
        currency: donationData.currency
      });
    } catch (dbError) {
      console.error('❌ Database save failed:', dbError);
      return NextResponse.json(
        { error: 'Failed to save donation record' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('🔥 Error processing invoice:', error);
    return NextResponse.json(
      { error: 'Failed to process invoice' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  console.log(`🆕 Subscription created: ${subscription.id}, status: ${subscription.status}`)

  // Log subscription creation for analytics/tracking
  try {
    const customer = await stripe.customers.retrieve(subscription.customer as string)
    const customerEmail = customer && typeof customer === 'object' && !('deleted' in customer)
      ? customer.email
      : 'unknown'

    console.log(`📊 New subscription: ${subscription.id} for ${customerEmail}`)

    // You could add analytics tracking here
    // await analytics.track('Subscription Created', { ... })
  } catch (error) {
    console.error('Failed to log subscription creation:', error)
  }

  return NextResponse.json({ received: true })
}

async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  console.log(`🔄 Subscription updated: ${subscription.id}, status: ${subscription.status}`)

  // Handle status changes
  if (subscription.status === 'active') {
    console.log(`✅ Subscription ${subscription.id} is now active`)
  } else if (subscription.status === 'canceled') {
    console.log(`❌ Subscription ${subscription.id} was canceled`)
    // Could send cancellation email here
  }

  return NextResponse.json({ received: true })
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  console.log(`🗑️ Subscription deleted: ${subscription.id}`)

  try {
    const customer = await stripe.customers.retrieve(subscription.customer as string)
    const customerEmail = customer && typeof customer === 'object' && !('deleted' in customer)
      ? customer.email
      : null

    if (customerEmail) {
      // Could send cancellation confirmation email
      console.log(`📧 Subscription canceled for ${customerEmail}`)
    }
  } catch (error) {
    console.error('Failed to process subscription deletion:', error)
  }

  return NextResponse.json({ received: true })
}

async function handlePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice
  console.log(`⚠️ Invoice payment failed: ${invoice.id}`)

  const subscriptionId = (invoice as any).subscription as string | null

  // Get customer email and details
  let customerEmail: string | null = null
  let customerName = 'Donor'

  try {
    const customer = await stripe.customers.retrieve(invoice.customer as string)
    if (customer && typeof customer === 'object' && !('deleted' in customer)) {
      customerEmail = customer.email
      customerName = customer.name || 'Donor'
    }
  } catch (error) {
    console.error('Failed to retrieve customer for failed payment:', error)
  }

  if (customerEmail && subscriptionId) {
    try {
      // Get retry information
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const nextRetryDate = invoice.next_payment_attempt
        ? new Date(invoice.next_payment_attempt * 1000)
        : null

      await sendPaymentFailedEmail({
        to: customerEmail,
        donorName: customerName,
        invoiceId: invoice.id ?? '',
        amount: invoice.amount_due / 100,
        currency: invoice.currency.toUpperCase(),
        hostedInvoiceUrl: invoice.hosted_invoice_url || '',
        billingReason: invoice.billing_reason || 'subscription_cycle',
        nextRetryDate: nextRetryDate ?? new Date(0),
        updatePaymentUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/donations/update-payment?customer_id=${invoice.customer}`
      })

      console.log(`📧 Payment failure notification sent to ${customerEmail}`)
    } catch (err) {
      console.error('Failed to send payment failure email:', err)
    }
  }

  return NextResponse.json({ received: true })
}

async function handlePaymentActionRequired(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice
  console.log(`🔐 Payment action required for invoice: ${invoice.id}`)

  // This could be used to notify users about 3D Secure or other authentication requirements
  // For now, just log it
  return NextResponse.json({ received: true })
}

async function handleSubscriptionPastDue(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  console.log(`📅 Subscription past due: ${subscription.id}`)

  try {
    const customer = await stripe.customers.retrieve(subscription.customer as string)
    const customerEmail = customer && typeof customer === 'object' && !('deleted' in customer)
      ? customer.email
      : null

    if (customerEmail) {
      // Send past due notification
      console.log(`⚠️ Subscription ${subscription.id} is past due for ${customerEmail}`)
      // Could send specific past due email here
    }
  } catch (error) {
    console.error('Failed to handle past due subscription:', error)
  }

  return NextResponse.json({ received: true })
}

async function handleSubscriptionUnpaid(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  console.log(`💸 Subscription unpaid (final failure): ${subscription.id}`)

  try {
    const customer = await stripe.customers.retrieve(subscription.customer as string)
    const customerEmail = customer && typeof customer === 'object' && !('deleted' in customer)
      ? customer.email
      : null

    if (customerEmail) {
      // Send final failure notification
      console.log(`❌ Subscription ${subscription.id} failed permanently for ${customerEmail}`)
      // Could send subscription canceled due to payment failure email
    }
  } catch (error) {
    console.error('Failed to handle unpaid subscription:', error)
  }

  return NextResponse.json({ received: true })
}

// Helper function to extract payment method type from charge
function getPaymentMethodType(charge: Stripe.Charge | null): string {
  if (!charge) return 'card'

  if (charge.payment_method_details?.card) {
    const brand = charge.payment_method_details.card.brand
    const last4 = charge.payment_method_details.card.last4
    return `${brand} •••• ${last4}`
  }

  return charge.payment_method_details?.type || 'card'
}

// Enhanced function to save donor and donation records
async function saveDonationRecord(data: {
  email: string
  name: string
  phone?: string
  amount: number
  currency: string
  donationType: string
  frequency?: string
  paymentMethod: string
  isRecurring: boolean
  stripePaymentIntentId?: string
  stripeChargeId?: string
  stripeSubscriptionId?: string
  receiptUrl?: string
  created: Date
}): Promise<{ donor: DonorRecord; donation: DonationRecord }> {
  try {
    // Convert dates to ISO strings for Xata
    const lastDonationDate = data.created.toISOString()
    const donationDate = data.created.toISOString()

    // 1. Upsert donor record
    let donor = await xata.db.donors
      .filter({ email: data.email })
      .getFirst()

    const donorUpdate = {
      email: data.email,
      name: data.name,
      phone: data.phone,
      totalDonations: (donor?.totalDonations || 0) + data.amount,
      lastDonationDate,
      donationFrequency: data.frequency
    }

    if (donor) {
      donor = await xata.db.donors.update(donor.xata_id, donorUpdate)
    } else {
      donor = await xata.db.donors.create({
        ...donorUpdate,
        email: data.email
      })
    }

    if (!donor) {
      throw new Error('Failed to create/update donor record')
    }

    // 2. Create donation record
    const donationData = {
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
      stripeSubscriptionId: data.isRecurring ? (data.stripeSubscriptionId || null) : null, receiptUrl: data.receiptUrl,
      date: data.created.toISOString()
    }

    const donation = await xata.db.donations.create(donationData)
    if (!donation) {
      throw new Error('Failed to create donation record')
    }

    console.log('✅ Successfully saved records to Xata:',
      { donorId: donor.xata_id, donationId: donation.xata_id })

    return {
      donor: {
        ...donor,
        phone: donor.phone ?? undefined,
        lastDonationDate: donor.lastDonationDate instanceof Date
          ? donor.lastDonationDate.toISOString()
          : donor.lastDonationDate
      },
      donation: {
        ...donation,
        donorPhone: donation.donorPhone ?? undefined,
        stripeChargeId: donation.stripeChargeId ?? undefined,
        stripePaymentIntentId: donation.stripePaymentIntentId ?? undefined,
        stripeSubscriptionId: donation.stripeSubscriptionId ?? undefined,
        frequency: donation.frequency === null ? undefined : donation.frequency,
        date: (donation as any).date instanceof Date
          ? (donation as any).date.toISOString()
          : (donation as any).date
      }
    }
  } catch (error) {
    console.error('❌ Database save error:', error)
    throw error
  }
}