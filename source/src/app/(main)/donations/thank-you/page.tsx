"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface ReceiptData {
    donorName: string
    donorEmail: string
    donorPhone?: string
    amount: number
    currency: string
    donationType: string
    paymentMethod: string
    receiptUrl?: string
    created: number
}

interface PaymentResult {
    status: string
    receipt?: ReceiptData
    error?: string
}

export default function ThankYouPage() {
    const searchParams = useSearchParams()
    const { toast } = useToast()

    const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null)
    const [loading, setLoading] = useState(true)
    //const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')

    useEffect(() => {
        async function verifyPayment() {
            const paymentIntentId = searchParams.get("payment_intent")
            //const redirectStatus = searchParams.get("redirect_status")

            if (!paymentIntentId) {
                setPaymentResult({ status: "missing_params" })
                setLoading(false)
                return
            }

            try {
                const res = await fetch(`/api/stripe/verify-payment?payment_intent=${paymentIntentId}`)
                const data = await res.json()

                if (!res.ok) {
                    throw new Error(data.error || "Payment verification failed")
                }

                if (data.status !== "succeeded") {
                    setPaymentResult({
                        status: data.status || "failed",
                        error: data.error
                    })
                } else {
                    setPaymentResult({
                        status: "succeeded",
                        receipt: {
                            donorName: data.metadata.donorName,
                            donorEmail: data.metadata.donorEmail,
                            donorPhone: data.metadata.donorPhone,
                            amount: data.amount / 100,
                            currency: data.currency,
                            donationType: data.metadata.donationType,
                            paymentMethod: data.payment_method_types?.[0] || "card",
                            receiptUrl: data.charges?.data[0]?.receipt_url,
                            created: data.created
                        }
                    })
                }
            } catch (err: unknown) {
                console.error("Payment verification error:", err)
                const message = err instanceof Error ? err.message : "Payment verification failed"
                toast({
                    title: "Verification Error",
                    description: message,
                    variant: "destructive",
                })
                setPaymentResult({
                    status: "verification_failed",
                    error: message
                })
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
                    <p className="text-gray-600">
                        Please wait while we confirm your payment...
                    </p>
                </div>
            </div>
        )
    }

    if (!paymentResult || paymentResult.status !== "succeeded") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
                <div className="max-w-md space-y-6">
                    <div className="text-red-500 text-6xl mb-4">!</div>
                    <h1 className="text-2xl font-bold">Donation Not Completed</h1>
                    <p className="text-gray-600">
                        {paymentResult?.error ||
                            "There was an issue processing your donation. Please try again or contact support."}
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

    const receipt = paymentResult.receipt!

    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
            <div className="max-w-md space-y-6">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                <h1 className="text-3xl font-bold">Thank You for Your Donation!</h1>

                <div className="bg-gray-50 p-4 rounded-lg text-left space-y-2">
                    <p>
                        <strong>Name:</strong> {receipt.donorName}
                    </p>
                    <p>
                        <strong>Email:</strong> {receipt.donorEmail}
                    </p>
                    {receipt.donorPhone && (
                        <p>
                            <strong>Phone:</strong> {receipt.donorPhone}
                        </p>
                    )}
                    <p>
                        <strong>Amount:</strong> ${receipt.amount.toFixed(2)} {receipt.currency.toUpperCase()}
                    </p>
                    <p>
                        <strong>Donation Type:</strong> {receipt.donationType}
                    </p>
                    <p>
                        <strong>Payment Method:</strong> {receipt.paymentMethod}
                    </p>
                </div>

                {receipt.receiptUrl && (
                    <p className="text-gray-600">
                        A receipt has been sent to your email and is also{" "}
                        <a
                            href={receipt.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                        >
                            available here
                        </a>.
                    </p>
                )}

                <div className="pt-4 space-y-2">
                    <Button asChild>
                        <Link href="/">Return to Home</Link>
                    </Button>
                    {receipt.receiptUrl && (
                        <Button variant="outline" asChild>
                            <a
                                href={receipt.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View Receipt
                            </a>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}