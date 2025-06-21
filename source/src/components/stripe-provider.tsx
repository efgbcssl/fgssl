// src/components/stripe-provider.tsx
"use client"

import { ReactNode, useEffect, useState } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripeProviderProps {
    children: ReactNode
    donationAmount: number
    donorName: string
    donorEmail: string
    donorPhone: string
    donationType: string
}

export function StripeProvider({ children, donationAmount, donorEmail, donorName, donorPhone, donationType }: StripeProviderProps) {
    const [clientSecret, setClientSecret] = useState('')
    //const [paymentIntentId, setPaymentIntentId] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        async function createIntent() {
            try {
                const response = await fetch('/api/stripe/create-payment-intent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: Math.round(donationAmount * 100), // Convert to cents
                        currency: 'usd',
                        metadata: {
                            donorName,
                            donorEmail,
                            donorPhone,
                            donationType,
                            paymentMethod: "card"
                        }
                    })
                })

                if (!response.ok) {
                    const err = await response.json()
                    throw new Error(err.error || "Failed to create payment intent")
                }

                const { clientSecret } = await response.json()

                if (!clientSecret) {
                    throw new Error('Missing client secret or ID')
                }

                setClientSecret(clientSecret)

            } catch (err: unknown) {
                setError('Failed to initialize payment system')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        createIntent()
    }, [donationAmount, donorName, donorEmail, donorPhone, donationType])

    if (loading) return <div className="text-center py-8">Initializing payment system...</div>
    if (error) return <div className="text-center text-red-500 py-8">Error: {error}</div>
    if (!clientSecret) return <div className="text-center py-8">Payment system not available</div>

    return (
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
            {children}
        </Elements>
    )
}
