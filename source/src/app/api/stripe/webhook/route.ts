/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { xata } from '@/lib/xata'
import { sendDonationEmail, sendPaymentFailedEmail } from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Type definitions
interface DonorRecord {
  xata_id?: string
  name?: string
  email: string
  phone?: string | null
  totalDonations?: number
  lastDonationDate?: Date | string
  donationFrequency?: string
}

interface DonationRecord {
  xata_id?: string
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
  stripeChargeId?: string
  stripeSubscriptionId?: string
  receiptUrl?: string
}

type PaymentMethodType = 'card' | 'bank' | 'other'

export async function POST(req: Request) {
  console.log('🔵 [WEBHOOK] Received webhook request')

  const signature = (await headers()).get('stripe-signature')
  if (!signature) {
    console.error('🔴 Missing Stripe signature header')
    return NextResponse.json(
      { error: 'Missing Stripe signature' },
      { status: 400 }
    )
  }

  const body = await req.text()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      endpointSecret
    )
    console.log(`🟢 Webhook verified - Type: ${event.type}, ID: ${event.id}`)
  } catch (err) {
    console.error('🔴 Webhook verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

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
    email: data.email,
    amount: data.amount,
    type: data.donationType,
    isRecurring: data.isRecurring
  })

  const lastDonationDate = data.created.toISOString()
  const donationDate = data.created.toISOString()

  // Upsert donor
  let donor = await xata.db.donors
    .filter({ email: data.email })
    .getFirst()

  const donorUpdate = {
    email: data.email,
    name: data.name,
    phone: data.phone,
    totalDonations: (donor?.totalDonations || 0) + data.amount,
    lastDonationDate,
    donationFrequency: data.frequency || (data.isRecurring ? 'monthly' : 'one-time')
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
    console.log('⏭️ Skipping subscription payment')
    return NextResponse.json({ received: true })
  }

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
    name: metadata.donorName || charge?.billing_details?.name || 'Anonymous',
    email: metadata.donorEmail || charge?.billing_details?.email || '',
    phone: metadata.donorPhone || charge?.billing_details?.phone || '',
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency.toUpperCase(),
    donationType: metadata.donationType || 'General Donation',
    frequency: metadata.frequency || 'one-time',
    paymentMethod: paymentMethod.description,
    isRecurring: false,
    stripePaymentIntentId: paymentIntent.id,
    stripeChargeId: charge?.id,
    receiptUrl: charge?.receipt_url || '',
    created: new Date(paymentIntent.created * 1000)
  }

  // Validate required fields
  if (!donorData.email) {
    console.error('❌ Missing donor email')
    return NextResponse.json(
      { error: 'Missing donor email' },
      { status: 400 }
    )
  }

  // Save to database
  try {
    const { donor, donation } = await saveDonationRecord(donorData)
    console.log('✅ Saved donation:', donation, donor)

    // Send confirmation email
    if (donorData.email) {
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
      console.log('✉️ Sent confirmation email')
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Failed to save donation:', error)
    return NextResponse.json(
      { error: 'Failed to save donation' },
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
      stripe.subscriptions.retrieve(subscriptionId),
      stripe.customers.retrieve(invoice.customer as string)
    ])

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
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
      const charge = paymentIntent.latest_charge as Stripe.Charge | null
      paymentMethod = getPaymentMethodDetails(charge).description
    }

    // Determine frequency
    const frequency = subscription.metadata?.frequency ||
      (subscription.items.data[0]?.price?.recurring?.interval + 'ly') ||
      'monthly'

    // Prepare donation data
    const donationData = {
      email: customerEmail,
      name: customerName,
      phone: (customer && typeof customer === 'object' && !('deleted' in customer))
        ? customer.phone
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

    // Save to database
    const { donor, donation } = await saveDonationRecord(donationData)
    console.log('✅ Saved recurring donation:', donation.xata_id)

    // Send confirmation email
    await sendDonationEmail({
      to: customerEmail,
      donorName: customerName,
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
    console.log('✉️ Sent recurring donation email')

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
    const customer = await stripe.customers.retrieve(invoice.customer as string)
    if (!customer || typeof customer !== 'object' || 'deleted' in customer) {
      console.log('⏭️ Customer not found')
      return NextResponse.json({ received: true })
    }

    const customerEmail = customer.email
    if (!customerEmail) {
      console.log('⏭️ No customer email')
      return NextResponse.json({ received: true })
    }

    await sendPaymentFailedEmail({
      to: customerEmail,
      donorName: customer.name || 'Donor',
      invoiceId: invoice.id ?? '',
      amount: invoice.amount_due / 100,
      currency: invoice.currency.toUpperCase(),
      hostedInvoiceUrl: invoice.hosted_invoice_url || '',
      nextRetryDate: invoice.next_payment_attempt
        ? new Date(invoice.next_payment_attempt * 1000)
        : null,
      updatePaymentUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/donations/update-payment?customer_id=${invoice.customer}`,
      billingReason: invoice.billing_reason || null,
    })
    console.log('✉️ Sent payment failed email')

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Failed to handle payment failure:', error)
    return NextResponse.json({ received: true })
  }
}

async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  console.log('🆕 Subscription created:', subscription.id)
  return NextResponse.json({ received: true })
}

async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  console.log('🔄 Subscription updated:', subscription.id)
  return NextResponse.json({ received: true })
}

async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  console.log('🗑️ Subscription deleted:', subscription.id)
  return NextResponse.json({ received: true })
}

export const config = {
  api: {
    bodyParser: false,
  },
}