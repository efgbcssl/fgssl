"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PaymentResult {
    status: string
    amount?: number
    donationType?: string
    receiptUrl?: string
    date?: number
    error?: string
}

export default function ThankYouPage() {
    const searchParams = useSearchParams()
    const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null)
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        async function verifyPayment() {
            const paymentIntent = searchParams.get('payment_intent')
            const redirectStatus = searchParams.get('redirect_status')

            if (!paymentIntent || !redirectStatus) {
                setPaymentResult({ status: 'missing_params' })
                setLoading(false)
                return
            }

            try {
                const response = await fetch(`/api/stripe/verify-payment?payment_intent=${paymentIntent}`)
                const data = await response.json()

                if (!data.status) {
                    throw new Error('Invalid response from server')
                }

                setPaymentResult({
                    status: data.status,
                    amount: data.amount ? data.amount / 100 : undefined,
                    donationType: data.donationType,
                    receiptUrl: data.receipt_url,
                    date: data.created
                })

                if (data.status !== 'succeeded') {
                    toast({
                        title: "Payment Not Completed",
                        description: `Your payment is in '${data.status}' status. Please contact support if this persists.`,
                        variant: "destructive"
                    })
                }

            } catch (error: unknown) {
                console.error('Payment verification error:', error)
                let errorMessage = "Couldn't verify your payment. Please contact support."
                if (error instanceof Error) {
                    errorMessage = error.message
                }
                toast({
                    title: "Verification Error",
                    description: errorMessage,
                    variant: "destructive"
                })
                setPaymentResult({ status: 'verification_failed' })
            } finally {
                setLoading(false)
            }
        }

        verifyPayment()
    }, [searchParams, toast])

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
                <div className="max-w-md space-y-6">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <h1 className="text-2xl font-bold">Verifying Your Donation</h1>
                    <p className="text-gray-600">Please wait while we confirm your payment...</p>
                </div>
            </div>
        )
    }

    if (!paymentResult || paymentResult.status !== 'succeeded') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
                <div className="max-w-md space-y-6">
                    <div className="text-red-500 text-6xl mb-4">!</div>
                    <h1 className="text-2xl font-bold">Donation Not Completed</h1>
                    <p className="text-gray-600">
                        {paymentResult?.status === 'missing_params'
                            ? "We couldn't retrieve your payment details. Please check your email for confirmation."
                            : "There was an issue processing your donation. Please try again or contact support."}
                    </p>
                    <div className="pt-4 space-y-2">
                        <Button asChild>
                            <Link href="/donations">Try Again</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/contact">Contact Support</Link>
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
            <div className="max-w-md space-y-6">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                <h1 className="text-3xl font-bold">Thank You for Your Donation!</h1>

                <div className="bg-gray-50 p-4 rounded-lg text-left space-y-2">
                    <p><strong>Amount:</strong> ${paymentResult.amount?.toFixed(2)}</p>
                    {paymentResult.donationType && (
                        <p><strong>Type:</strong> {paymentResult.donationType}</p>
                    )}
                    <p><strong>Status:</strong> Payment Succeeded</p>
                </div>

                <p className="text-gray-600">
                    Your generous contribution helps support our ministry and community outreach programs.
                    {paymentResult.receiptUrl ? (
                        <>
                            {' '}A receipt has been sent to your email and is also{' '}
                            <a href={paymentResult.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                available here
                            </a>.
                        </>
                    ) : (
                        ' A receipt has been sent to your email.'
                    )}
                </p>

                <div className="pt-4 space-y-2">
                    <Button asChild>
                        <Link href="/">Return to Home</Link>
                    </Button>
                    {paymentResult.receiptUrl && (
                        <Button variant="outline" asChild>
                            <a href={paymentResult.receiptUrl} target="_blank" rel="noopener noreferrer">
                                View Receipt
                            </a>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
