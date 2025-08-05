/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { xata } from '@/lib/xata'
import {
  sendDonationEmail,
  sendPaymentFailedEmail,
  sendSubscriptionConfirmationEmail,
  sendSubscriptionUpdateEmail,
  sendSubscriptionCancellationEmail
} from '@/lib/email'
import { randomUUID } from 'crypto'
import { generateUnsubscribeLink } from '@/lib/helper'
import { createExpiringToken } from '@/lib/utils';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Type definitions
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
  receiptUrl?: string | null
}

// failedPayments table
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

// subscriptionCancellations table
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

type PaymentMethodType = 'card' | 'bank' | 'other'

export async function POST(req: Request) {
  console.log('🔵 [WEBHOOK] Received webhook request')

  const signature = (await headers()).get('stripe-signature') as string
  console.log('🔵 [WEBHOOK] Stripe signature:', signature)

  // Debug info
  console.log('🔵 [WEBHOOK] Endpoint secret:', endpointSecret ? 'EXISTS' : 'MISSING')
  console.log('🔵 [WEBHOOK] Secret length:', endpointSecret?.length)
  console.log('🔵 [WEBHOOK] Secret prefix:', endpointSecret?.substring(0, 6))

  console.log('🔵 [WEBHOOK] Request headers:', Object.fromEntries(await headers()))
  /*if (!signature) {
  //console.error('🔴 Missing Stripe signature header')
  //return NextResponse.json(
  // { error: 'Missing Stripe signature' },
  //{ status: 400 }
  //)
  }*/

  //const buf = await req.arrayBuffer()
  //console.log('🔵 [WEBHOOK] Raw request body length:', buf.byteLength)
  //const body = Buffer.from(buf).toString('utf8')
  const body = await req.text();
  console.log('🔵 [WEBHOOK] Raw body:', body)
  console.log('🔵 [WEBHOOK] Body length:', body.length)
  console.log('🔵 [WEBHOOK] Body first 100 chars:', body.substring(0, 100))
  console.log('🔵 [WEBHOOK] Body last 100 chars:', body.substring(body.length - 100))

  //let event: Stripe.Event
  const event = JSON.parse(body) as Stripe.Event

  /* try {
     //event = stripe.webhooks.constructEvent(
       //body,
       //signature,
       //endpointSecret
     //)
     //console.log(`🟢 Webhook verified - Type: ${event.type}, ID: ${event.id}`)
   //} catch (err) {
     //console.error('🔴 Webhook verification failed:', err)
     //return NextResponse.json(
       //{ error: 'Invalid signature' },
       //{ status: 400 }
     )
   }*/

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        return await handlePaymentIntentSucceeded(event)
      case 'invoice.payment_succeeded':
        return await handleInvoicePaymentSucceeded(event)
      case 'invoice.payment_failed':
        return await handlePaymentFailed(event)
      case 'customer.subscription.created':
        return await handleSubscriptionCreated(event)
      case 'customer.subscription.updated':
        return await handleSubscriptionUpdated(event)
      case 'customer.subscription.deleted':
        return await handleSubscriptionDeleted(event)
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

// Helper functions
function getPaymentMethodDetails(charge: Stripe.Charge | null): {
  type: PaymentMethodType
  description: string
} {
  if (!charge) return { type: 'card', description: 'Card' }

  const details = charge.payment_method_details
  if (!details) return { type: 'card', description: 'Card' }

  if (details.card) {
    return {
      type: 'card',
      description: `${details.card.brand} •••• ${details.card.last4}`
    }
  }

  return { type: 'other', description: details.type || 'Unknown' }
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
  receiptUrl?: string
  created: Date
}): Promise<{ donor: DonorRecord; donation: DonationRecord }> {
  console.log('💾 Saving donation record:', {
    donorsId: data.donorsId,
    email: data.email,
    amount: data.amount,
    type: data.donationType,
    isRecurring: data.isRecurring
  })

  const lastDonationDate = data.created;
  const donationDate = data.created.toISOString()


  // Upsert donor
  let donor = await xata.db.donors
    .filter({ email: data.email })
    .getFirst()

  const donorUpdate: Partial<DonorRecord> & {
    donorsId: string | null
    email: string
    name: string
    phone?: string
    totalDonations: number
  } = {
    donorsId: data.donorsId,
    email: data.email,
    name: data.name,
    phone: data.phone,
    totalDonations: (donor?.totalDonations || 0) + data.amount,
    lastDonationDate,
    donationFrequency: data.frequency || (data.isRecurring ? 'monthly' : 'one-time'),
    lastUpdated: new Date(),
    hasActiveSubscription: data.isRecurring && !!data.stripeSubscriptionId,
    activeSubscriptionId: data.stripeSubscriptionId,
    subscriptionStartDate: data.created,
    subscriptionStatus: data.isRecurring && data.stripeSubscriptionId ? 'active' : null,
    stripeCustomerId: donor?.stripeCustomerId || null,
  }

  // Add subscription-specific fields for recurring donations
  if (data.isRecurring && data.stripeSubscriptionId) {
    donorUpdate.hasActiveSubscription = true
    donorUpdate.activeSubscriptionId = data.stripeSubscriptionId
    donorUpdate.subscriptionStatus = 'active'

    // Only set start date if this is a new subscription
    if (!donor?.activeSubscriptionId) {
      donorUpdate.subscriptionStartDate = data.created
    }
  }

  donor = donor
    ? await xata.db.donors.update(donor.xata_id, donorUpdate)
    : await xata.db.donors.create(donorUpdate)

  if (!donor) throw new Error('Failed to save donor record')

  // Create donation
  const donation = await xata.db.donations.create({
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
    receiptUrl: data.receiptUrl,
  })

  if (!donation) throw new Error('Failed to save donation record')

  return { donor, donation }
}

// Event handlers
async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent
  console.log('💳 PaymentIntent succeeded:', paymentIntent.id)

  // Skip subscription payments (handled by invoice webhook)
  if (paymentIntent.metadata?.subscriptionId || (paymentIntent as any).invoice) {
    console.log('⏭️ Skipping subscription payment - handled by invoice webhook')
    return NextResponse.json({ received: true })
  }

  try {
    // Get charge details
    let charge: Stripe.Charge | null = null
    if (paymentIntent.latest_charge) {
      charge = await stripe.charges.retrieve(
        typeof paymentIntent.latest_charge === 'string'
          ? paymentIntent.latest_charge
          : paymentIntent.latest_charge.id
      )
    }

    const paymentMethod = getPaymentMethodDetails(charge)
    const metadata = paymentIntent.metadata || {}

    // Prepare donor data
    const donorData = {
      donorsId: randomUUID(),
      name: metadata.donorName || charge?.billing_details?.name || 'Anonymous',
      email: metadata.donorEmail || charge?.billing_details?.email || '',
      phone: metadata.donorPhone || charge?.billing_details?.phone || '',
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
    }

    console.log("Donor data:", donorData)

    // Validate required fields
    if (!donorData.email) {
      console.error('❌ Missing donor email for payment intent:', paymentIntent.id)
      return NextResponse.json(
        { error: 'Missing donor email' },
        { status: 400 }
      )
    }

    // Save to database
    const { donor, donation } = await saveDonationRecord(donorData)
    console.log('✅ Saved one-time donation:', donation.donorsId)

    // Send confirmation email
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
    })

    console.log('✉️ Sent one-time donation confirmation email')
    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('❌ Failed to process payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    )
  }
}

async function handleInvoicePaymentSucceeded(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice
  console.log('📄 Invoice payment succeeded:', invoice.id)

  const subscriptionId = (invoice as any).subscription as string | undefined
  if (!subscriptionId) {
    console.log('⏭️ Skipping non-subscription invoice')
    return NextResponse.json({ received: true })
  }

  try {
    // Get subscription and customer details
    const [subscription, customer] = await Promise.all([
      stripe.subscriptions.retrieve(subscriptionId as string),
      stripe.customers.retrieve(invoice.customer as string)
    ])
    // Validate customer exists and has email
    if (typeof customer === 'string' || customer.deleted) {
      console.error('❌ Customer not found or deleted');
      return NextResponse.json({ error: 'Customer not found' }, { status: 400 });
    }
    console.log('🔵 Subscription retrieved:', subscription)
    console.log('🔵 Customer retrieved:', customer)

    if (subscription.status !== 'active') {
      console.log(`⚠️ Unexpected subscription state: ${subscription.status}`);
      console.log(`ℹ️ Subscription metadata: ${JSON.stringify(subscription.metadata)}`);
      // Add additional logging or error handling as needed
    }
    // Prepare customer data
    const customerEmail = invoice.customer_email ||
      (customer && typeof customer === 'object' && !('deleted' in customer)
        ? customer.email
        : '')
    const customerName = (customer && typeof customer === 'object' && !('deleted' in customer)
      ? customer.name
      : '') || subscription.metadata?.donorName || 'Recurring Donor'

    if (!customerEmail) {
      console.error('❌ Missing customer email')
      return NextResponse.json(
        { error: 'Missing customer email' },
        { status: 400 }
      )
    }

    // Get payment method details
    const paymentIntentId = (invoice as any).payment_intent as string | undefined
    let paymentMethod = 'card'
    if (paymentIntentId) {
      console.log('🔵 Payment intent ID:', paymentIntentId)
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
      console.log('🔵 Payment intent retrieved:', paymentIntent)
      if (paymentIntent.latest_charge) {
        const chargeId = typeof paymentIntent.latest_charge === 'string'
          ? paymentIntent.latest_charge
          : paymentIntent.latest_charge.id;
        console.log('🔵 Charge ID:', chargeId)

        const charge = await stripe.charges.retrieve(chargeId)
        console.log('🔵 Charge retrieved:', charge)
        paymentMethod = getPaymentMethodDetails(charge).description
      }
    }

    // Determine frequency
    const frequency = subscription.metadata?.frequency ||
      (subscription.items.data[0]?.price?.recurring?.interval + 'ly') ||
      'monthly'

    // Prepare donation data
    const donationData = {
      donorsId: subscription.metadata?.donorsId || null,
      email: customerEmail,
      name: customerName,
      phone: (customer && typeof customer === 'object' && !('deleted' in customer))
        ? customer.phone
        ?? undefined
        : undefined,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency.toUpperCase(),
      donationType: subscription.metadata?.donationType || 'Recurring Donation',
      frequency,
      paymentMethod,
      isRecurring: true,
      stripePaymentIntentId: paymentIntentId,
      stripeSubscriptionId: subscription.id,
      stripeChargeId: (invoice as any).charge as string | undefined,
      receiptUrl: invoice.hosted_invoice_url || '',
      created: new Date(invoice.created * 1000)
    }

    console.log('🔵 Donation data:', donationData)


    // Save to database
    try {
      const { donor, donation } = await saveDonationRecord(donationData)
      console.log('✅ Saved recurring donation:', donation.donorsId)
    } catch (error) {
      console.error('❌ Failed to save donation record:', error)
    }

    console.log('📨 Preparing to send recurring donation email to', customerEmail)

    // Send confirmation email
    try {
      const unsubscribeLink = await generateUnsubscribeLink(subscription.id, customerEmail);
      console.log("unsubscribe link ", unsubscribeLink)
      
      await sendDonationEmail({
        to: customerEmail,
        donorName: customerName,
        amount: donationData.amount,
        donationType: donationData.donationType,
        receiptUrl: donationData.receiptUrl || invoice.invoice_pdf || '',
        createdDate: donationData.created,
        paymentMethod: donationData.paymentMethod,
        currency: donationData.currency,
        frequency: donationData.frequency,
        isRecurring: true,
        unsubscribeLink: unsubscribeLink
      })
      console.log('✉️ Sent recurring donation email')
    } catch (error) {
      console.error('❌ Failed to send donation email:', error)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Failed to process invoice:', error)
    return NextResponse.json(
      { error: 'Failed to process invoice' },
      { status: 500 }
    )
  }
}

async function handlePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice
  console.log('⚠️ Invoice payment failed:', invoice.id)

  try {
    // Validate invoice has customer
    if (!invoice.customer) {
      console.error('❌ Failed payment invoice missing customer:', invoice.id)
      return NextResponse.json({ received: true })
    }

    const customer = await stripe.customers.retrieve(invoice.customer as string)
    if (!customer || typeof customer !== 'object' || 'deleted' in customer) {
      console.warn('⚠️ Customer not found for failed payment:', invoice.customer)
      return NextResponse.json({ received: true })
    }

    const customerEmail = customer.email
    const customerName = customer.name || 'Donor'

    if (!customerEmail) {
      console.warn('⚠️ No email found for failed payment customer:', invoice.customer)
      return NextResponse.json({ received: true })
    }

    // Determine if this is recurring or one-time
    const isRecurring = !!(invoice as any).subscription
    const subscriptionId = (invoice as any).subscription as string | null

    console.log(`💸 Processing ${isRecurring ? 'recurring' : 'one-time'} payment failure for:`, customerEmail)

    // Get subscription details if recurring
    let subscriptionStatus = null
    let cancelAtPeriodEnd = false

    if (isRecurring && subscriptionId) {
      try {
        console.log('🔵 Retrieving subscription:', subscriptionId)
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        subscriptionStatus = subscription.status
        cancelAtPeriodEnd = subscription.cancel_at_period_end

        console.log(`📊 Subscription status: ${subscriptionStatus}, cancel_at_period_end: ${cancelAtPeriodEnd}`)
        console.log('🔵 Cancel at period end:', cancelAtPeriodEnd)
      } catch (error) {
        console.error('❌ Failed to retrieve subscription:', error)
      }
    }

    // Prepare failure details
    const failureReason = invoice.billing_reason || 'payment_failed'
    const nextRetryDate = invoice.next_payment_attempt
      ? new Date(invoice.next_payment_attempt * 1000)
      : null

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
    })
    console.log(`✉️ Sent ${isRecurring ? 'recurring' : 'one-time'} payment failure email`)

    // Log failed payment attempt in database
    try {
      await xata.db.failedPayments.create({
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
      })
      console.log('📝 Logged failed payment to database')
    } catch (error) {
      console.warn('⚠️ Could not log failed payment to database:', error)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('❌ Failed to handle payment failure:', error)
    return NextResponse.json({ received: true })
  }
}

async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  console.log('🆕 Subscription created:', subscription.id)

  try {
    // Get customer details
    const customer = await stripe.customers.retrieve(subscription.customer as string)
    if (!customer || typeof customer !== 'object' || 'deleted' in customer) {
      console.error('❌ Customer not found for new subscription:', subscription.customer)
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const customerEmail = customer.email
    const customerName = customer.name || 'Donor'

    if (!customerEmail) {
      console.error('❌ Missing customer email for subscription:', subscription.id)
      return NextResponse.json({ error: 'Missing customer email' }, { status: 400 })
    }

    // Extract subscription details
    const priceItem = subscription.items.data[0]
    const amount = (priceItem?.price?.unit_amount || 0) / 100
    const currency = priceItem?.price?.currency?.toUpperCase() || 'USD'
    const interval = priceItem?.price?.recurring?.interval || 'month'
    const frequency = `${interval}ly`

    console.log(`🔄 New ${frequency} subscription created for ${customerEmail}: ${amount} ${currency}`)

    // Update donor record to reflect recurring donation setup
    try {
      let donor = await xata.db.donors.filter({ email: customerEmail }).getFirst()

      const donorUpdate = {
        email: customerEmail,
        name: customerName,
        phone: customer.phone || undefined,
        donationFrequency: frequency,
        hasActiveSubscription: true,
        stripeCustomerId: customer.id,
        activeSubscriptionId: subscription.id,
        subscriptionStartDate: new Date(subscription.created * 1000),
        subscriptionStatus: subscription.status,
        lastUpdated: new Date()
      }

      donor = donor
        ? await xata.db.donors.update(donor.xata_id, donorUpdate)
        : await xata.db.donors.create(donorUpdate)

      console.log('✅ Updated donor record for subscription:', donor?.xata_id)
    } catch (error) {
      console.error('❌ Failed to update donor record:', error)
    }
const unsubscribeLink = await generateUnsubscribeLink(subscription.id, customerEmail);
      console.log("unsubscribe link ", unsubscribeLink)
    // Send subscription confirmation email
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
    })

    console.log('✉️ Sent subscription confirmation email')
    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('❌ Failed to handle subscription creation:', error)
    return NextResponse.json(
      { error: 'Failed to process subscription creation' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  const previousAttributes = event.data.previous_attributes as Partial<Stripe.Subscription>

  console.log('🔄 Subscription updated:', subscription.id)

  try {
    // Get customer details
    const customer = await stripe.customers.retrieve(subscription.customer as string)
    if (!customer || typeof customer !== 'object' || 'deleted' in customer) {
      console.warn('⚠️ Customer not found for subscription update:', subscription.customer)
      return NextResponse.json({ received: true })
    }

    const customerEmail = customer.email
    const customerName = customer.name || 'Donor'

    if (!customerEmail) {
      console.warn('⚠️ No email for subscription update:', subscription.id)
      return NextResponse.json({ received: true })
    }

    // Determine what changed
    const changes: string[] = []
    const currentItem = subscription.items.data[0]
    const currentAmount = (currentItem?.price?.unit_amount || 0) / 100
    const currentCurrency = currentItem?.price?.currency?.toUpperCase() || 'USD'
    const currentInterval = currentItem?.price?.recurring?.interval || 'month'

    // Check for amount changes
    if (previousAttributes.items) {
      const previousAmount = (previousAttributes.items.data?.[0]?.price?.unit_amount || 0) / 100
      if (previousAmount !== currentAmount) {
        changes.push(`Amount changed from ${previousAmount} to ${currentAmount}`)
      }
    }

    // Check for status changes
    if (previousAttributes.status && previousAttributes.status !== subscription.status) {
      changes.push(`Status changed from ${previousAttributes.status} to ${subscription.status}`)
    }

    // Check for cancellation scheduling
    if (subscription.cancel_at_period_end && !previousAttributes.cancel_at_period_end) {
      changes.push('Subscription scheduled for cancellation at period end')
    } else if (!subscription.cancel_at_period_end && previousAttributes.cancel_at_period_end) {
      changes.push('Subscription cancellation was cancelled - will continue')
    }

    console.log(`📝 Subscription changes detected:`, changes)

    // Update donor record
    try {
      const donor = await xata.db.donors.filter({ email: customerEmail }).getFirst()
      if (donor) {
        await xata.db.donors.update(donor.xata_id, {
          donationFrequency: `${currentInterval}ly`,
          hasActiveSubscription: subscription.status === 'active',
          subscriptionStatus: subscription.status,
          lastUpdated: new Date()
        })
        console.log('✅ Updated donor record for subscription change')
      }
    } catch (error) {
      console.error('❌ Failed to update donor record:', error)
    }

    // Send update notification email if there are meaningful changes
    if (changes.length > 0) {
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
        manageSubscriptionUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/donations/manage?customer_id=${customer.id}`
      })

      console.log('✉️ Sent subscription update email')
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('❌ Failed to handle subscription update:', error)
    return NextResponse.json({ received: true })
  }
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  console.log('🗑️ Subscription cancelled:', subscription.id)

  try {
    // Get customer details
    const customer = await stripe.customers.retrieve(subscription.customer as string)
    if (!customer || typeof customer !== 'object' || 'deleted' in customer) {
      console.warn('⚠️ Customer not found for cancelled subscription:', subscription.customer)
      return NextResponse.json({ received: true })
    }

    const customerEmail = customer.email
    const customerName = customer.name || 'Donor'

    if (!customerEmail) {
      console.warn('⚠️ No email for cancelled subscription:', subscription.id)
      return NextResponse.json({ received: true })
    }

    // Extract final subscription details
    const priceItem = subscription.items.data[0]
    const amount = (priceItem?.price?.unit_amount || 0) / 100
    const currency = priceItem?.price?.currency?.toUpperCase() || 'USD'
    const frequency = `${priceItem?.price?.recurring?.interval || 'month'}ly`
    const cancelledAt = new Date(subscription.canceled_at ? subscription.canceled_at * 1000 : Date.now())

    console.log(`❌ ${frequency} subscription cancelled for ${customerEmail}: ${amount} ${currency}`)

    // Get donor record for total contributions
    let donor = null
    try {
      donor = await xata.db.donors.filter({ email: customerEmail }).getFirst()
    } catch (error) {
      console.warn('⚠️ Could not retrieve donor record:', error)
    }

    // Update donor record
    try {
      if (donor) {
        await xata.db.donors.update(donor.xata_id, {
          hasActiveSubscription: false,
          subscriptionStatus: 'cancelled',
          subscriptionCancelledAt: cancelledAt,
          activeSubscriptionId: null,
          donationFrequency: 'one-time', // Reset to one-time
          lastUpdated: new Date()
        })
        console.log('✅ Updated donor record for cancellation')
      }
    } catch (error) {
      console.error('❌ Failed to update donor record:', error)
    }

    // Log cancellation
    try {
      await xata.db.subscriptionCancellation.create({
        subscriptionId: subscription.id,
        customerEmail,
        customerName,
        amount,
        currency,
        frequency,
        cancelledAt,
        cancellationReason: subscription.cancellation_details?.reason || 'user_requested',
        totalDonationsBeforeCancellation: donor?.totalDonations || 0,
        voluntaryCancellation: subscription.cancellation_details?.reason !== 'payment_failed'
      })
      console.log('📝 Logged subscription cancellation')
    } catch (error) {
      console.warn('⚠️ Could not log cancellation to database:', error)
    }

    // Send cancellation confirmation email
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
    })

    console.log('✉️ Sent subscription cancellation email')
    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('❌ Failed to handle subscription cancellation:', error)
    return NextResponse.json({ received: true })
  }
}
export const config = {
  api: {
    bodyParser: false,
  },
}