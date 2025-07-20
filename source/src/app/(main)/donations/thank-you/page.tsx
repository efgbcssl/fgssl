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
}

interface PaymentResult {
    status: string
    receipt?: ReceiptData
    error?: string
}

const BIBLE_QUOTES = [
    {
        verse: "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.",
        reference: "2 Corinthians 9:7"
    },
    {
        verse: "Bring the whole tithe into the storehouse, that there may be food in my house. Test me in this, says the LORD Almighty, and see if I will not throw open the floodgates of heaven and pour out so much blessing that there will not be room enough to store it.",
        reference: "Malachi 3:10"
    },
    {
        verse: "Give, and it will be given to you. A good measure, pressed down, shaken together and running over, will be poured into your lap. For with the measure you use, it will be measured to you.",
        reference: "Luke 6:38"
    },
    {
        verse: "Whoever is kind to the poor lends to the LORD, and he will reward them for what they have done.",
        reference: "Proverbs 19:17"
    },
    {
        verse: "Do not store up for yourselves treasures on earth, where moths and vermin destroy, and where thieves break in and steal. But store up for yourselves treasures in heaven...",
        reference: "Matthew 6:19-20"
    }
]

export default function ThankYouPage() {
    const searchParams = useSearchParams()
    const { toast } = useToast()

    const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null)
    const [loading, setLoading] = useState(true)
    const [randomQuote, setRandomQuote] = useState(BIBLE_QUOTES[0])
    const [verificationAttempts, setVerificationAttempts] = useState(0)

    useEffect(() => {
        // Select a random Bible quote
        setRandomQuote(BIBLE_QUOTES[Math.floor(Math.random() * BIBLE_QUOTES.length)])

        async function verifyPayment() {
            const paymentIntentId = searchParams.get("payment_intent")
            const subscriptionId = searchParams.get("subscription_id")
            const successParam = searchParams.get("success")

            if (successParam === "true") {
                setPaymentResult({ status: "succeeded" })
                setLoading(false)
                return
            }

            if (!paymentIntentId && !subscriptionId) {
                setPaymentResult({ status: "missing_params" })
                setLoading(false)
                return
            }

            try {
                const endpoint = subscriptionId
                    ? `/api/stripe/verify-subscription?subscription_id=${subscriptionId}`
                    : `/api/stripe/verify-payment?payment_intent=${paymentIntentId}`

                const res = await fetch(endpoint)
                const data = await res.json()

                if (!res.ok) throw new Error(data.error || "Payment verification failed")

                const isSuccess = data.status === "succeeded" ||
                    data.status === "active" ||
                    data.active === true
                if (!isSuccess) {
                    // If not successful but might still be processing (especially for subscriptions)
                    if (verificationAttempts < 3 && subscriptionId) {
                        setTimeout(() => {
                            setVerificationAttempts(prev => prev + 1)
                            verifyPayment()
                        }, 2000) // Retry after 2 seconds
                        return
                    }

                    setPaymentResult({
                        status: data.status || "failed",
                        error: data.error
                    })
                } else {
                    const donation = data.donation || {}
                    setPaymentResult({
                        status: "succeeded",
                        receipt: {
                            donorName: donation.donorName || "Anonymous",
                            donorEmail: donation.donorEmail,
                            donorPhone: donation.donorPhone,
                            amount: donation.amount || 0,
                            currency: donation.currency || 'USD',
                            donationType: donation.donationType || 'Offering',
                            paymentMethod: donation.paymentMethod || 'card',
                            receiptUrl: donation.receiptUrl,
                            created: donation.created || Date.now(),
                            frequency: donation.frequency,
                            isRecurring: donation.isRecurring || false
                        }
                    })
                }
            } catch (err: unknown) {
                console.error("Payment verification error:", err)
                const message = err instanceof Error ? err.message : "Payment verification failed"

                // Only show toast if we're not going to retry
                if (verificationAttempts >= 3 || !subscriptionId) {
                    toast({
                        title: "Verification Error",
                        description: message,
                        variant: "destructive",
                    })
                }

                setPaymentResult({
                    status: "verification_failed",
                    error: message
                })
            } finally {
                setLoading(false)
            }
        }

        verifyPayment()
    }, [searchParams, toast, verificationAttempts])

    const isSuccessful = () => {
        if (!paymentResult) return false

        // Explicit success cases
        if (paymentResult.status === "succeeded") return true

        // Check for subscription success params in URL
        const subscriptionSuccess = searchParams.get("subscription") === "true"
        const successParam = searchParams.get("success") === "true"

        return subscriptionSuccess || successParam
    }

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-gradient-to-b from-blue-50 to-white">
                <div className="max-w-md space-y-6">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="mx-auto"
                    >
                        <RotateCw className="h-12 w-12 text-blue-600" />
                    </motion.div>
                    <h1 className="text-2xl font-bold text-gray-800">Verifying Your Donation</h1>
                    <p className="text-gray-600">
                        We&apos;re confirming your generous gift...
                    </p>
                </div>
            </div>
        )
    }

    if (!isSuccessful()) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-gradient-to-b from-blue-50 to-white">
                <div className="max-w-md space-y-6">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-red-500 text-6xl mb-4"
                    >
                        ❌
                    </motion.div>
                    <h1 className="text-2xl font-bold text-gray-800">Donation Not Completed</h1>
                    <p className="text-gray-600">
                        {paymentResult?.error ||
                            "We encountered an issue processing your donation. Please try again or contact our support team."}
                    </p>
                    <div className="pt-4 space-y-2">
                        <Button asChild className="w-full">
                            <Link href="/donations">
                                <Heart className="mr-2 h-4 w-4" /> Try Again
                            </Link>
                        </Button>
                        <Button variant="outline" asChild className="w-full">
                            <Link href="/contact">
                                <Mail className="mr-2 h-4 w-4" /> Contact Support
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    const receipt = paymentResult!.receipt!
    // In your thank-you page component
    const formattedDate = receipt?.created
        ? new Date(receipt.created).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
            <div className="max-w-2xl w-full space-y-8">
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            Thank You, {receipt.donorName}!
                        </h1>
                        <p className="text-xl text-gray-600 mb-6">
                            Your {receipt.isRecurring ? `${receipt.frequency} ` : ''}
                            donation to {receipt.donationType} makes a difference.
                        </p>
                    </motion.div>
                </AnimatePresence>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4"
                >
                    <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                        Donation Summary
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <p className="text-sm text-gray-500">Donor Name</p>
                            <p className="font-medium">{receipt.donorName}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium">{receipt.donorEmail}</p>
                        </div>
                        {receipt.donorPhone && (
                            <div className="space-y-2">
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="font-medium">{receipt.donorPhone}</p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="font-medium">{formattedDate}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-500">Amount</p>
                            <p className="font-medium">
                                {receipt.currency.toUpperCase()} {receipt.amount.toFixed(2)}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-500">Donation Type</p>
                            <p className="font-medium">
                                {receipt.donationType}
                                {receipt.isRecurring && (
                                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                        {receipt.frequency}
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-500">Payment Method</p>
                            <p className="font-medium capitalize">{receipt.paymentMethod}</p>
                        </div>
                        {receipt.receiptUrl && (
                            <div className="space-y-2">
                                <p className="text-sm text-gray-500">Receipt</p>
                                <a
                                    href={receipt.receiptUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-blue-600 hover:underline"
                                >
                                    Download Receipt
                                </a>
                            </div>
                        )}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="bg-blue-50 rounded-xl p-6 text-center"
                >
                    <blockquote className="space-y-2">
                        <p className="text-lg italic text-gray-700">&quot;{randomQuote.verse}&quot;</p>
                        <footer className="text-sm text-gray-600">— {randomQuote.reference}</footer>
                    </blockquote>
                </motion.div>

                {receipt.isRecurring && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center"
                    >
                        <p className="text-yellow-800">
                            Your {receipt.frequency} donation has been set up successfully.
                            A confirmation has been sent to your email. You can manage your
                            recurring donation anytime through your account.
                        </p>
                    </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="flex flex-col sm:flex-row gap-3 justify-center pt-4"
                >
                    <Button asChild className="flex-1 max-w-xs">
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" /> Return Home
                        </Link>
                    </Button>
                    {receipt.receiptUrl && (
                        <Button variant="outline" asChild className="flex-1 max-w-xs">
                            <a
                                href={receipt.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View Receipt
                            </a>
                        </Button>
                    )}
                    <Button variant="outline" asChild className="flex-1 max-w-xs">
                        <Link href="/donations">
                            <Heart className="mr-2 h-4 w-4" /> Give Again
                        </Link>
                    </Button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="text-center text-sm text-gray-500 mt-8"
                >
                    <p>Need help? Contact us at <a href="mailto:donations@efgbcssl.org" className="text-blue-600">donations@efgbcssl.org</a></p>
                    <p className="mt-1">Ethiopian Full Gospel Believers Church (Silver Spring Local)</p>
                </motion.div>
            </div>
        </div>
    )
}