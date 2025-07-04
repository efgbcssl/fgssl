// app/api/stripe/create-price/route.ts
import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { xata } from '@/lib/xata'

//const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//  apiVersion: '2025-05-28.basil'
//})

export async function POST(req: Request) {
    const { eventId, price, currency, productName } = await req.json()

    try {
        // Check if we already have a price for this event
        /*const existingEvent = await xata.db.events.read(eventId)

        if (existingEvent?.stripePriceId) {
            // Retrieve the existing price to check if it matches
            const existingPrice = await stripe.prices.retrieve(existingEvent.stripePriceId)

            if (existingPrice.unit_amount === price && existingPrice.currency === currency) {
                // Price hasn't changed, return existing ID
                return NextResponse.json({ priceId: existingEvent.stripePriceId })
            }

            // Price changed, create a new one
        }

        // Create or update product
        let productId: string
        if (existingEvent?.xata_id) {
            await stripe.products.update(existingEvent.xata_id, {
                name: productName,
                active: true
            })
            productId = existingEvent.xata_id
        } else {
            const product = await stripe.products.create({
                name: productName,
                metadata: { eventId }
            })
            productId = product.id

            // Store product ID in Xata
            await xata.db.events.update(eventId, {
                xata_id: productId
            })
        }

        // Create new price
        const stripePrice = await stripe.prices.create({
            product: productId,
            unit_amount: price,
            currency: currency.toLowerCase(),
            metadata: { eventId }
        })

        return NextResponse.json({ priceId: stripePrice.id })*/
    } catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        )
    }
}