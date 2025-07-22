/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
            expand: [
                'latest_invoice',
                'latest_invoice.payment_intent',
                'latest_invoice.payment_intent.charges.data',
                'customer'
            ]
        })

        console.log('ℹ️ Subscription status:', subscription.status)
        console.log('ℹ️ Subscription metadata:', subscription.metadata)

        if (subscription.status === 'active' || subscription.status === 'trialing') {
            console.log('🟢 Subscription is active/trialing')
            const formattedResponse = await formatSubscriptionResponse(subscription)
            return NextResponse.json({
                status: 'succeeded',
                active: true,
                subscription: formattedResponse
            })
        }

        // Handle other statuses
        const errorMap: Record<string, { status: number; message: string }> = {
            past_due: { status: 402, message: 'Subscription payment is past due' },
            canceled: { status: 400, message: 'Subscription was canceled' },
            unpaid: { status: 402, message: 'Subscription payment failed' },
            incomplete: { status: 402, message: 'Subscription payment incomplete' },
            incomplete_expired: { status: 400, message: 'Subscription incomplete and expired' }
        }

        const error = errorMap[subscription.status] || {
            status: 400,
            message: 'Subscription not active'
        }

        console.log(`🔴 Subscription status: ${subscription.status}`)
        return NextResponse.json(
            { status: subscription.status, error: error.message },
            { status: error.status }
        )

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

        // Get price details with proper fallbacks
        const price = subscription.items.data[0].price
        const amount = price.unit_amount ? price.unit_amount / 100 :
            (invoice?.amount_paid || invoice?.amount_due || 0) / 100
        const currency = price.currency?.toUpperCase() ||
            invoice?.currency?.toUpperCase() ||
            'USD'

        // Get customer details
        let customer: Stripe.Customer | Stripe.DeletedCustomer
        if (typeof subscription.customer === 'string') {
            customer = await stripe.customers.retrieve(subscription.customer)
        } else {
            customer = subscription.customer
        }

        // Get payment method description
        let paymentMethod = 'card'
        const paymentIntent = (invoice as any).payment_intent as Stripe.PaymentIntent | null
        if (paymentIntent?.payment_method && typeof paymentIntent.payment_method === 'string') {
            const method = await stripe.paymentMethods.retrieve(paymentIntent.payment_method)
            if (method.card) {
                paymentMethod = `${method.card.brand} •••• ${method.card.last4}`
            }
        }

        // Get frequency
        const frequency = subscription.metadata?.frequency ||
            price.recurring?.interval ||
            'monthly'

        return {
            status: 'succeeded',
            active: true,
            donation: {
                donorName: subscription.metadata?.donorName || (customer as Stripe.Customer)?.name || 'Recurring Donor',
                donorEmail: subscription.metadata?.donorEmail || (customer as Stripe.Customer)?.email || '',
                donorPhone: subscription.metadata?.donorPhone || (customer as Stripe.Customer)?.phone || '',
                amount: amount,
                currency: currency,
                donationType: subscription.metadata?.donationType || 'Recurring Donation',
                paymentMethod: paymentMethod,
                receiptUrl: invoice?.hosted_invoice_url || '',
                created: subscription.created,
                frequency: subscription.metadata?.frequency || price.recurring?.interval || 'monthly',
                isRecurring: true,
                subscriptionId: subscription.id,
                // Add these to ensure frontend gets the data:
                originalAmount: subscription.metadata?.amount ?
                    Number(subscription.metadata.amount) / 100 : amount
            }
        }
    } catch (error) {
        console.error('🔴 Error formatting subscription response:', error)
        throw error
    }
}