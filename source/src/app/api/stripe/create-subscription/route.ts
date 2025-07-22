/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
})

interface RequestBody {
  name: string
  email: string
  phone?: string
  amount: number
  donationType: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  paymentMethodId?: string // Optional - will create if not provided
}

// Valid Stripe interval types
const intervalMap: Record<RequestBody['frequency'], 'day' | 'week' | 'month' | 'year'> = {
  daily: 'day',
  weekly: 'week',
  monthly: 'month',
  yearly: 'year'
}

export async function POST(req: Request) {
  try {
    console.log('📩 Received POST request for subscription')

    const body: RequestBody = await req.json()
    const { name, email, phone, amount, donationType, frequency, paymentMethodId } = body

    console.log('✅ Parsed request body:', { name, email, phone, amount, donationType, frequency })

    // 1. Validate input
    if (!name || !email || !amount || !donationType || !frequency) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    if (amount < 50) {
      return NextResponse.json({ message: 'Amount must be at least $0.50' }, { status: 400 })
    }

    // 2. Create customer
    console.log('👤 Finding or creating customer in Stripe...')
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1
    });

    const customer = existingCustomers.data.length > 0
      ? existingCustomers.data[0]
      : await stripe.customers.create({
        email,
        name,
        phone: phone || undefined,
        metadata: { donationType, frequency }
      });
    console.log('✅ Customer:', customer.id)

    // 3. Handle payment method
    const finalPaymentMethodId = paymentMethodId

    if (!finalPaymentMethodId) {
      // If no payment method provided, create setup intent for frontend to complete
      console.log('💳 No payment method provided, creating setup intent...')
      const setupIntent = await stripe.setupIntents.create({
        customer: customer.id,
        usage: 'off_session',
        payment_method_types: ['card'],
        metadata: {
          name,
          email,
          donationType,
          frequency,
          amount: amount.toString()
        }
      })

      return NextResponse.json({
        setupIntent: {
          id: setupIntent.id,
          client_secret: setupIntent.client_secret
        },
        customerId: customer.id,
        requiresPaymentMethod: true,
        message: 'Customer created. Complete payment method setup.'
      })
    }

    // 4. Attach payment method to customer
    console.log('💳 Attaching payment method to customer...')
    await stripe.paymentMethods.attach(finalPaymentMethodId, {
      customer: customer.id
    })

    // Set as default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: finalPaymentMethodId
      }
    })
    console.log('✅ Payment method attached and set as default')

    // 5. Create product and price
    console.log('🛒 Creating product and price...')
    const interval = intervalMap[frequency]
    const productName = `${donationType} (${frequency})`

    const price = await stripe.prices.create({
      product_data: {
        name: productName,
        metadata: { donationType, frequency }
      },
      unit_amount: amount,
      currency: 'usd',
      recurring: { interval }
    })
    console.log('✅ Price created:', price.id)

    // 6. Create subscription with immediate payment
    console.log('🔄 Creating subscription with immediate payment...')
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      default_payment_method: finalPaymentMethodId,
      proration_behavior: 'none',
      billing_cycle_anchor: undefined,
      trial_period_days: 0,
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card']
      },
      automatic_tax: { enabled: false },
      collection_method: 'charge_automatically',
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        donorName: name,
        donorEmail: email,
        donorPhone: phone || '',
        donationType,
        frequency,
        amount: amount.toString(),
        originalAmount: amount.toString()
      }
    })

    console.log('✅ Subscription created:', subscription.id)
    console.log('🔍 Subscription status:', subscription.status)

    // 7. Handle payment intent response
    let clientSecret: string | null = null
    let paymentStatus = 'unknown'

    if (subscription.latest_invoice && typeof subscription.latest_invoice === 'object') {
      const invoice = subscription.latest_invoice as Stripe.Invoice
      console.log('📄 Latest invoice:', JSON.stringify(subscription.latest_invoice, null, 2))

      if ((invoice as any).payment_intent && typeof (invoice as any).payment_intent === 'object') {
        const paymentIntent = (invoice as any).payment_intent as Stripe.PaymentIntent
        clientSecret = paymentIntent.client_secret
        paymentStatus = paymentIntent.status
        console.log('🔑 PaymentIntent status:', paymentStatus)

        if (paymentStatus === 'requires_action' || paymentStatus === 'requires_confirmation') {
          console.log('🔐 Payment requires additional action')
          return NextResponse.json({
            clientSecret,
            subscriptionId: subscription.id,
            customerId: customer.id,
            status: subscription.status,
            requiresAction: true,
            paymentStatus
          })
        }

        if (paymentStatus === 'succeeded') {
          console.log('✅ Payment succeeded immediately!')
          return NextResponse.json({
            subscriptionId: subscription.id,
            customerId: customer.id,
            status: subscription.status,
            paymentStatus: 'succeeded',
            message: 'Subscription created and payment successful!'
          })
        }

        if (paymentStatus === 'requires_payment_method' || paymentStatus === 'canceled') {
          console.log('❌ Initial payment failed')
          await stripe.subscriptions.cancel(subscription.id)

          return NextResponse.json({
            message: 'Initial payment failed. Please try a different payment method.',
            error: 'payment_failed',
            paymentStatus
          }, { status: 402 })
        }
      }
    }

    console.log('⚠️ Unexpected subscription state')
    return NextResponse.json({
      subscriptionId: subscription.id,
      customerId: customer.id,
      status: subscription.status,
      paymentStatus,
      message: 'Subscription created but payment status unclear',
      donation: {
        donorName: name,
        donorEmail: email,
        amount: amount / 100,
        donationType,
        frequency,
        isRecurring: true
      }
    })

  } catch (err) {
    console.error('🔥 Subscription error:', err)

    if (err instanceof stripe.errors.StripeError) {
      const { type, code, message } = err

      if (code === 'card_declined' || code === 'insufficient_funds') {
        return NextResponse.json({
          message: 'Payment was declined. Please check your payment method.',
          error: code,
          details: message
        }, { status: 402 })
      }

      if (code === 'authentication_required') {
        return NextResponse.json({
          message: 'Payment requires authentication.',
          error: code,
          details: message
        }, { status: 402 })
      }

      // Handle payment method not found error
      if (code === 'resource_missing' && message?.includes('payment_method')) {
        return NextResponse.json({
          message: 'Payment method not found. Please ensure the payment method exists.',
          error: 'payment_method_missing',
          details: message
        }, { status: 400 })
      }
      // Handle payment method already attached error
      if (code === 'payment_method_already_attached') {
        return NextResponse.json({
          message: 'This payment method is already in use. Please use a different payment method.',
          error: 'payment_method_in_use'
        }, { status: 400 });
      }
    }
    // Handle other errors
    const errorMessage = err instanceof Error ? err.message : 'Internal server error'
    const statusCode = errorMessage.includes('Invalid API Key') ? 401 : 500

    return NextResponse.json(
      {
        message: 'Failed to create subscription',
        error: errorMessage
      },
      { status: statusCode }
    )
  }
}