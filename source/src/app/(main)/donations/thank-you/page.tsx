"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Heart, Home, RotateCw, Mail } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"

// Enhanced type definitions with all required fields
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

            // Default fallback receipt data
            const defaultReceipt: ReceiptData = {
                donorName: "Generous Donor",
                donorEmail: "",
                amount: 0,
                currency: "USD",
                donationType: "Donation",
                paymentMethod: "card",
                created: Date.now() / 1000,
                isRecurring: false
            }

            try {
                // If success param exists but no IDs, use default receipt
                if (successParam === "true" && !paymentIntentId && !subscriptionId) {
                    setPaymentResult({
                        status: "succeeded",
                        receipt: defaultReceipt
                    })
                    setLoading(false)
                    return
                }

                // Verify payment if we have IDs
                if (paymentIntentId || subscriptionId) {
                    const endpoint = subscriptionId
                        ? `/api/stripe/verify-subscription?subscription_id=${subscriptionId}`
                        : `/api/stripe/verify-payment?payment_intent=${paymentIntentId}`

                    const res = await fetch(endpoint)
                    const data = await res.json()

                    if (!res.ok) throw new Error(data.error || "Verification failed")

                    setPaymentResult({
                        status: "succeeded",
                        receipt: {
                            ...defaultReceipt,
                            ...data.donation,
                            donorName: data.donation?.donorName || defaultReceipt.donorName,
                            donorEmail: data.donation?.donorEmail || defaultReceipt.donorEmail
                        }
                    })
                } else {
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

    // Safe access to receipt with fallbacks
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

    const formattedDate = new Date((receipt.created || Date.now() / 1000) * 1000).toLocaleDateString('en-US', {
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
                            <span>{receipt.currency} {(receipt.amount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Date:</span>
                            <span>{formattedDate}</span>
                        </div>
                        {receipt.receiptUrl && (
                            <div className="pt-4">
                                <a
                                    href={receipt.receiptUrl}
                                    target="_blank"
                                    className="text-blue-600 hover:underline"
                                >
                                    Download Receipt
                                </a>
                            </div>
                        )}
                    </div>
                </div>

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
            </div>
        </div>
    )
}