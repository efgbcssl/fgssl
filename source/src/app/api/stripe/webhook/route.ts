/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
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

export async function POST(req: Request) {
  console.log('🔵 [WEBHOOK START] Received webhook request')
  console.log('🔵 Reading request body...')
  const body = await req.text()
  const sig = (await headers()).get('stripe-signature')
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
  console.log('🔵 [PAYMENT_INTENT] Handling payment_intent.succeeded')
  const paymentIntent = event.data.object as Stripe.PaymentIntent
  const metadata = paymentIntent.metadata || {}

  console.log(`💳 PaymentIntent succeeded: ${paymentIntent.id}`)
  console.log(`ℹ️ PaymentIntent ID: ${paymentIntent.id}`)
  console.log('ℹ️ Metadata:', JSON.stringify(metadata, null, 2))

  // Skip if this is a subscription payment (handled by invoice.payment_succeeded)
  if (metadata.subscriptionId || (paymentIntent as any).invoice) {
    console.log('⏭️ Skipping subscription payment (handled by invoice webhook)')
    return NextResponse.json({ received: true })
  }

  // Get charge details for receipt
  let charge: Stripe.Charge | null = null
  if (paymentIntent.latest_charge) {
    try {
      charge = await stripe.charges.retrieve(
        typeof paymentIntent.latest_charge === 'string'
          ? paymentIntent.latest_charge
          : paymentIntent.latest_charge.id,
        { expand: ['payment_intent'] }
      )
      console.log('⚡ Charge details retrieved:', charge?.id)
    } catch (err) {
      console.error('⚠️ Failed to retrieve charge:', err)
    }
  }

  // Prepare comprehensive donor data
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
    stripeChargeId: charge?.id || null,
    created: new Date(paymentIntent.created * 1000),
    paymentIntentId: paymentIntent.id
  }

  console.log('📋 Prepared donor data:', JSON.stringify(donorData, null, 2))

  if (!donorData.email) {
    console.error('❌ Missing donor email in payment intent:', paymentIntent.id)
    return NextResponse.json({ received: true, error: 'Missing email' })
  }

  // Save donor and donation records
  try {
    console.log('💾 Attempting to save donation record...')
    const { donor, donation } = await saveDonationRecord({
      ...donorData,
      isRecurring: false,
      stripePaymentIntentId: paymentIntent.id,
      stripeChargeId: donorData.stripeChargeId ?? undefined,
    })

    console.log('✅ Database records saved:', {
      donorId: donor?.xata_id,
      donationId: donation?.xata_id
    })

    // Send confirmation email
    if (donorData.email) {
      console.log('📧 Preparing to send confirmation email...')
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
      console.log('✉️ Confirmation email sent')
    }

    console.log(`✅ Successfully processed payment ${paymentIntent.id}`)
  } catch (error) {
    console.error(`❌ Failed to process payment ${paymentIntent.id}:`, error)
    // Consider retry logic or dead letter queue here
  }

  return NextResponse.json({
    received: true,
    processed: true,
    paymentIntentId: paymentIntent.id,
    chargeId: charge?.id
  })
}

async function handleInvoicePaymentSucceeded(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice
  const subscriptionId = (invoice as any).subscription as string | null

  console.log(`💰 Invoice payment succeeded: ${invoice.id}`)

  if (!subscriptionId) {
    console.log('⏭️ Skipping non-subscription invoice')
    return NextResponse.json({ received: true })
  }

  // Get subscription and customer details
  const [subscription, customer] = await Promise.all([
    stripe.subscriptions.retrieve(subscriptionId, { expand: ['items.data.price.product'] }),
    stripe.customers.retrieve(invoice.customer as string)
  ])

  // Get customer details
  let customerEmail: string
  let customerName: string = 'Recurring Donor'
  let customerPhone: string | undefined

  if (customer && typeof customer === 'object' && !('deleted' in customer)) {
    customerEmail = invoice.customer_email || customer.email || ''
    customerName = customer.name || subscription.metadata?.donorName || 'Recurring Donor'
    customerPhone = customer.phone || subscription.metadata?.donorPhone
  } else if (invoice.customer_email) {
    customerEmail = invoice.customer_email
  } else {
    console.error('❌ Missing customer email on invoice:', invoice.id)
    return NextResponse.json({ received: true, error: 'Missing email' })
  }

  // Get payment method info
  let paymentMethod = 'card'
  const paymentIntentId = (invoice as any).payment_intent as string | undefined
  if (paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['latest_charge']
      })
      const charge = paymentIntent.latest_charge as Stripe.Charge | null
      paymentMethod = getPaymentMethodType(charge)
    } catch (err) {
      console.error('Failed to retrieve payment method info:', err)
    }
  }

  // Prepare donation data
  const donationData = {
    email: customerEmail,
    name: customerName,
    phone: customerPhone,
    amount: invoice.amount_paid / 100,
    currency: invoice.currency.toUpperCase(),
    donationType: subscription.metadata?.donationType || 'Recurring Donation',
    frequency: subscription.metadata?.frequency || 'monthly',
    receiptUrl: invoice.hosted_invoice_url || '',
    created: new Date(invoice.created * 1000),
    subscriptionId: subscription.id,
    paymentMethod
  }

  try {
    // Save donor and donation records
    const { donor, donation } = await saveDonationRecord({
      ...donationData,
      isRecurring: true,
      stripePaymentIntentId: paymentIntentId,
      stripeSubscriptionId: subscription.id
    })

    // Send confirmation email
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
    })

    console.log(`✅ Processed recurring payment from invoice ${invoice.id}`)
  } catch (error) {
    console.error(`❌ Failed to process recurring payment ${invoice.id}:`, error)
  }

  return NextResponse.json({ received: true })
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
      frequency: data.frequency,
      donorName: data.name,
      donorEmail: data.email,
      donorPhone: data.phone,
      paymentMethod: data.paymentMethod,
      paymentStatus: 'succeeded',
      isRecurring: data.isRecurring,
      stripePaymentIntentId: data.stripePaymentIntentId,
      stripeChargeId: data.stripeChargeId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      receiptUrl: data.receiptUrl,
      date: donationDate
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