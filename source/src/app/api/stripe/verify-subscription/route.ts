/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-05-28.basil'
})

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('subscription_id')

    console.log('🔵 [VERIFY-SUBSCRIPTION] Starting verification for:', subscriptionId)

    if (!subscriptionId) {
        console.log('🔴 Missing subscription_id parameter')
        return NextResponse.json(
            { status: 'missing_params', error: 'Subscription ID is required' },
            { status: 400 }
        )
    }

    try {
        console.log('🔵 Retrieving subscription from Stripe...')
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ['latest_invoice', 'customer', 'latest_invoice.payment_intent']
        })

        console.log('ℹ️ Subscription status:', subscription.status)
        console.log('ℹ️ Subscription metadata:', subscription.metadata)

        // Handle subscription statuses
        switch (subscription.status) {
            case 'active':
                console.log('🟢 Subscription is active')
                const formattedResponse = await formatSubscriptionResponse(subscription)
                return NextResponse.json({
                    status: 'succeeded',
                    active: true,
                    subscription: formattedResponse
                })

            case 'trialing':
                console.log('🟡 Subscription is in trial period')
                return NextResponse.json({
                    status: 'trialing',
                    active: true,
                    message: 'Subscription is in trial period'
                })

            case 'past_due':
                console.log('🟠 Subscription payment is past due')
                return NextResponse.json({
                    status: 'past_due',
                    error: 'Subscription payment is past due'
                }, { status: 402 })

            case 'canceled':
                console.log('🔴 Subscription was canceled')
                return NextResponse.json({
                    status: 'canceled',
                    error: 'Subscription was canceled'
                }, { status: 400 })

            case 'incomplete':
            case 'incomplete_expired':
                console.log('🔴 Subscription payment incomplete')
                return NextResponse.json({
                    status: subscription.status,
                    error: 'Subscription payment incomplete'
                }, { status: 402 })

            case 'unpaid':
                console.log('🔴 Subscription is unpaid')
                return NextResponse.json({
                    status: 'unpaid',
                    error: 'Subscription payment failed'
                }, { status: 402 })

            default:
                console.log('🟡 Unknown subscription status:', subscription.status)
                return NextResponse.json({
                    status: subscription.status,
                    error: 'Subscription not active'
                }, { status: 400 })
        }

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Subscription verification failed'
        console.error('🔴 Verification error:', message)

        if (message.includes('No such subscription')) {
            return NextResponse.json(
                { status: 'not_found', error: 'Subscription not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(
            { status: 'error', error: message },
            { status: 500 }
        )
    }
}

async function formatSubscriptionResponse(subscription: Stripe.Subscription) {
    console.log('🔵 Formatting subscription response...')

    try {
        const invoice = subscription.latest_invoice as Stripe.Invoice | null
        const paymentIntent = (invoice as any).payment_intent as Stripe.PaymentIntent | null
        const charge = (paymentIntent as any).charges?.data[0]

        // Get customer details
        let customer: Stripe.Customer | Stripe.DeletedCustomer
        if (typeof subscription.customer === 'string') {
            console.log('🔵 Retrieving customer details...')
            customer = await stripe.customers.retrieve(subscription.customer)
        } else {
            customer = subscription.customer
        }

        // Get payment method details
        let paymentMethod = 'card'
        if (paymentIntent?.payment_method) {
            console.log('🔵 Retrieving payment method details...')
            const method = await stripe.paymentMethods.retrieve(
                paymentIntent.payment_method as string
            )
            if (method.card) {
                paymentMethod = `${method.card.brand} •••• ${method.card.last4}`
            }
        }

        // Get price details
        const price = subscription.items.data[0].price
        const amount = price.unit_amount ? price.unit_amount / 100 : 0
        const currency = price.currency.toUpperCase()

        // Get frequency from metadata or plan interval
        const frequency = subscription.metadata?.frequency ||
            price.recurring?.interval ||
            'monthly'

        console.log('ℹ️ Subscription details:', {
            customerName: (customer as Stripe.Customer)?.name,
            customerEmail: (customer as Stripe.Customer)?.email,
            amount,
            currency,
            frequency
        })

        return {
            status: 'succeeded',
            active: true,
            donation: {
                donorName: (customer as Stripe.Customer)?.name || subscription.metadata?.donorName || 'Recurring Donor',
                donorEmail: (customer as Stripe.Customer)?.email || subscription.metadata?.donorEmail || '',
                donorPhone: (customer as Stripe.Customer)?.phone || subscription.metadata?.donorPhone || '',
                amount,
                currency,
                donationType: subscription.metadata?.donationType || 'Recurring Donation',
                paymentMethod,
                receiptUrl: invoice?.hosted_invoice_url || '',
                created: subscription.created,
                frequency,
                isRecurring: true,
                subscriptionId: subscription.id,
            }
        }
    } catch (formatError) {
        console.error('🔴 Error formatting subscription response:', formatError)
        throw new Error('Failed to format subscription response')
    }
}