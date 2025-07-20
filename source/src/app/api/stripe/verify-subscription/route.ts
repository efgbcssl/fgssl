import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-05-28.basil'
})

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('subscription_id')

    if (!subscriptionId) {
        return NextResponse.json(
            { status: 'missing_params', error: 'Subscription ID is required' },
            { status: 400 }
        )
    }

    try {
        // Retrieve subscription with latest invoice
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ['latest_invoice']
        })

        // Handle subscription statuses
        switch (subscription.status) {
            case 'active':
                return NextResponse.json({
                    status: 'succeeded',
                    active: true,
                    subscription: await formatSubscriptionResponse(subscription)
                })

            case 'trialing':
                return NextResponse.json({
                    status: 'trialing',
                    active: true,
                    message: 'Subscription is in trial period'
                })

            case 'past_due':
                return NextResponse.json({
                    status: 'past_due',
                    error: 'Subscription payment is past due'
                }, { status: 402 })

            case 'canceled':
                return NextResponse.json({
                    status: 'canceled',
                    error: 'Subscription was canceled'
                }, { status: 400 })

            default:
                return NextResponse.json({
                    status: subscription.status,
                    error: 'Subscription not active'
                }, { status: 400 })
        }

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Subscription verification failed'
        return NextResponse.json(
            { status: 'error', error: message },
            { status: 500 }
        )
    }
}

async function formatSubscriptionResponse(subscription: Stripe.Subscription) {
    const invoice = subscription.latest_invoice as Stripe.Invoice | null
    const charge = (invoice as any).payment_intent
        ? ((invoice as any).payment_intent as Stripe.PaymentIntent).charges?.data[0]
        : null

    // Retrieve customer details from Stripe
    const customer =
        typeof subscription.customer === 'string'
            ? await stripe.customers.retrieve(subscription.customer)
            : subscription.customer

    return {
        status: 'succeeded',
        active: true,
        donation: {
            donorName: (customer as Stripe.Customer)?.name || subscription.metadata?.donorName,
            donorEmail: (customer as Stripe.Customer)?.email || subscription.metadata?.donorEmail,
            donorPhone: (customer as Stripe.Customer)?.phone || subscription.metadata?.donorPhone,
            amount: (subscription.items.data[0].price.unit_amount ?? 0) / 100,
            currency: subscription.items.data[0].price.currency.toUpperCase(),
            donationType: subscription.metadata?.donationType || 'Recurring Donation',
            paymentMethod: 'card', // Or get from payment method
            receiptUrl: invoice?.hosted_invoice_url,
            created: subscription.created,
            frequency: subscription.metadata?.frequency || 'monthly',
            isRecurring: true
        }
    }
}