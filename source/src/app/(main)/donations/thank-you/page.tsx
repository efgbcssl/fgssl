"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Heart, Home, RotateCw, Mail } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"

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
    frequency?: string
    isRecurring: boolean
    subscriptionId?: string
}

export default function ThankYouPage() {
    const searchParams = useSearchParams()
    const { toast } = useToast()
    const [paymentResult, setPaymentResult] = useState<{
        status: string
        receipt?: ReceiptData
        error?: string
    } | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const verifyPayment = async () => {
            const paymentIntentId = searchParams.get("payment_intent")
            const subscriptionId = searchParams.get("subscription_id")
            const successParam = searchParams.get("success")

            // First check for direct data in URL parameters (for immediate display)
            const urlName = searchParams.get("name")
            const urlEmail = searchParams.get("email")
            const urlAmount = searchParams.get("amount")
            const urlType = searchParams.get("donationType")
            const urlFrequency = searchParams.get("frequency")

            if (urlName && urlAmount) {
                setPaymentResult({
                    status: "succeeded",
                    receipt: {
                        donorName: decodeURIComponent(urlName),
                        donorEmail: urlEmail ? decodeURIComponent(urlEmail) : "",
                        amount: Number(urlAmount),
                        currency: "USD",
                        donationType: urlType ? decodeURIComponent(urlType) : "Donation",
                        paymentMethod: "card",
                        created: Date.now() / 1000,
                        frequency: urlFrequency || "one-time",
                        isRecurring: !!subscriptionId,
                        ...(subscriptionId && { subscriptionId })
                    }
                })
                setLoading(false)

                // Still verify in background but don't wait for it
                if (subscriptionId) {
                    verifyWithServer(subscriptionId)
                }
                return
            }

            // Verify payment if we have IDs
            try {
                if (paymentIntentId) {
                    const res = await fetch(`/api/stripe/verify-payment?payment_intent=${paymentIntentId}`)
                    const data = await res.json()

                    if (!res.ok) throw new Error(data.error || "Payment verification failed")

                    setPaymentResult({
                        status: "succeeded",
                        receipt: {
                            donorName: data.donation?.donorName || "Generous Donor",
                            donorEmail: data.donation?.donorEmail || "",
                            amount: data.donation?.amount || 0,
                            currency: data.donation?.currency || "USD",
                            donationType: data.donation?.donationType || "Donation",
                            paymentMethod: data.donation?.paymentMethod || "card",
                            receiptUrl: data.donation?.receiptUrl,
                            created: data.donation?.created || Date.now() / 1000,
                            isRecurring: false
                        }
                    })
                }
                else if (subscriptionId) {
                    await verifyWithServer(subscriptionId)
                }
                else if (successParam === "true") {
                    // Fallback for successful payments without IDs
                    setPaymentResult({
                        status: "succeeded",
                        receipt: {
                            donorName: "Generous Donor",
                            donorEmail: "",
                            amount: 0,
                            currency: "USD",
                            donationType: "Donation",
                            paymentMethod: "card",
                            created: Date.now() / 1000,
                            isRecurring: false
                        }
                    })
                }
                else {
                    throw new Error("Missing verification parameters")
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : "Verification failed"
                setPaymentResult({
                    status: "failed",
                    error: message
                })
            } finally {
                setLoading(false)
            }
        }

        const verifyWithServer = async (subscriptionId: string) => {
            try {
                const res = await fetch(`/api/stripe/verify-subscription?subscription_id=${subscriptionId}`)
                const data = await res.json()

                if (!res.ok) throw new Error(data.error || "Subscription verification failed")

                setPaymentResult({
                    status: "succeeded",
                    receipt: {
                        donorName: data.subscription?.donation?.donorName || "Recurring Donor",
                        donorEmail: data.subscription?.donation?.donorEmail || "",
                        donorPhone: data.subscription?.donation?.donorPhone || "",
                        amount: data.subscription?.donation?.amount || 0,
                        currency: data.subscription?.donation?.currency || "USD",
                        donationType: data.subscription?.donation?.donationType || "Recurring Donation",
                        paymentMethod: data.subscription?.donation?.paymentMethod || "card",
                        receiptUrl: data.subscription?.donation?.receiptUrl,
                        created: data.subscription?.donation?.created || Date.now() / 1000,
                        frequency: data.subscription?.donation?.frequency || "monthly",
                        isRecurring: true,
                        subscriptionId
                    }
                })
            } catch (error) {
                console.error("Subscription verification error:", error)
                // Don't override existing success state if URL params were good
                if (!paymentResult) {
                    setPaymentResult({
                        status: "failed",
                        error: "Subscription verification failed"
                    })
                }
            }
        }

        verifyPayment()
    }, [searchParams, toast])

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <RotateCw className="h-12 w-12 text-blue-600" />
                </motion.div>
                <h1 className="text-2xl font-bold mt-4">Verifying Your Donation</h1>
            </div>
        )
    }

    if (!paymentResult || paymentResult.status !== "succeeded") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
                <div className="text-red-500 text-6xl mb-4">❌</div>
                <h1 className="text-2xl font-bold">Donation Not Completed</h1>
                <p className="text-gray-600 mt-2">
                    {paymentResult?.error || "We encountered an issue processing your donation."}
                </p>
                <div className="mt-6 space-y-2">
                    <Button asChild>
                        <Link href="/donations">
                            <Heart className="mr-2 h-4 w-4" /> Try Again
                        </Link>
                    </Button>
                </div>
            </div>
        )
    }

    const receipt = paymentResult.receipt || {
        donorName: "Generous Donor",
        donorEmail: "",
        amount: 0,
        currency: "USD",
        donationType: "Donation",
        paymentMethod: "card",
        created: Date.now() / 1000,
        isRecurring: false
    }

    const formattedDate = new Date(receipt.created * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full space-y-6">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                <h1 className="text-3xl font-bold text-center">
                    Thank You, {receipt.donorName}!
                </h1>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="font-semibold mb-4">Donation Summary</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Amount:</span>
                            <span>{receipt.currency} {receipt.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Type:</span>
                            <span>{receipt.donationType}</span>
                        </div>
                        {receipt.isRecurring && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">Frequency:</span>
                                <span className="capitalize">
                                    {receipt.frequency === "one-time" ? "One-Time" : receipt.frequency}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-gray-600">Date:</span>
                            <span>{formattedDate}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Payment Method:</span>
                            <span>{receipt.paymentMethod}</span>
                        </div>
                        {receipt.receiptUrl && (
                            <div className="pt-4">
                                <a
                                    href={receipt.receiptUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                >
                                    Download Receipt
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {receipt.isRecurring && (
                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                        <p className="font-medium">Your recurring donation is active!</p>
                        <p className="mt-1">
                            You'll receive email confirmation and receipts for each payment.
                        </p>
                    </div>
                )}

                <div className="flex gap-3">
                    <Button asChild className="flex-1">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" /> Home
                        </Link>
                    </Button>
                    <Button variant="outline" asChild className="flex-1">
                        <Link href="/donations">
                            <Heart className="mr-2 h-4 w-4" /> Donate Again
                        </Link>
                    </Button>
                </div>

                <div className="text-center text-sm text-gray-500 mt-4">
                    <p>Questions about your donation?</p>
                    <Link
                        href="mailto:support@example.com"
                        className="inline-flex items-center text-blue-600 hover:underline mt-1"
                    >
                        <Mail className="mr-1 h-4 w-4" /> Contact us
                    </Link>
                </div>
            </div>
        </div>
    )
}