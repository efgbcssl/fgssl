// components/stripe-provider.tsx
"use client"

import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { ReactNode, useState, useEffect } from 'react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export function StripeProvider({ children }: { children: ReactNode }) {
    const [clientSecret, setClientSecret] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        async function createPaymentIntent() {
            try {
                const response = await fetch('/api/stripe/create-payment-intent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: 1000, // Default amount (can be overridden later)
                        currency: 'usd'
                    })
                })

                const { clientSecret } = await response.json()
                setClientSecret(clientSecret)
            } catch (err) {
                setError('Failed to initialize payment system')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        createPaymentIntent()
    }, [])

    if (loading) return <div className="text-center py-8">Initializing payment system...</div>
    if (error) return <div className="text-center py-8 text-red-500">{error}</div>
    if (!clientSecret) return <div className="text-center py-8">Payment system not available</div>

    return (
        <Elements
            stripe={stripePromise}
            options={{
                clientSecret,
                appearance: {
                    theme: 'stripe',
                    variables: {
                        colorPrimary: '#4f46e5',
                    }
                }
            }}
        >
            {children}
        </Elements>
    )
}