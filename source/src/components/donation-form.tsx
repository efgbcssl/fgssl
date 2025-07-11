"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/hooks/use-toast'
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const FormSchema = z.object({
    donationType: z.string().min(1, "Please select a donation type"),
    amount: z.string().min(1, "Please enter an amount"),
    donationFrequency: z.enum(["one-time", "monthly"]),
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    phone: z.string().optional(),
})

type DonationType = {
    id: string
    name: string
    description: string
    icon: React.ComponentType<{ className?: string }>
}

export function DonationForm({ donationTypes }: { donationTypes: DonationType[] }) {
    const [step, setStep] = useState<'form' | 'payment'>('form')
    const [clientSecret, setClientSecret] = useState<string>()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [paymentElementReady, setPaymentElementReady] = useState(false)
    const { toast } = useToast()

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            donationType: "",
            amount: "",
            name: "",
            email: "",
            phone: "",
        },
    })

    async function createPayment(values: z.infer<typeof FormSchema>) {
        setIsSubmitting(true)
        try {
            const parsedAmount = Math.round(Number(values.amount) * 100)
            if (isNaN(parsedAmount) || parsedAmount < 50 || parsedAmount > 1_000_000_00) {
                toast({
                    title: "Invalid amount",
                    description: "Amount must be between $0.50 and $1,000,000",
                    variant: "destructive"
                })
                return
            }

            const payload = {
                name: values.name,
                email: values.email,
                phone: values.phone,
                amount: parsedAmount,
                donationType: values.donationType,
                frequency: values.donationFrequency
            }

            const endpoint =
                values.donationFrequency === 'monthly'
                    ? '/api/stripe/create-subscription'
                    : '/api/stripe/create-payment-intent'

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await res.json()
            if (!res.ok || !data.clientSecret) {
                throw new Error(data.message || 'Payment setup failed')
            }

            setClientSecret(data.clientSecret)
            setStep('payment')
        } catch (err) {
            const message = err instanceof Error ? err.message : "Something went wrong"
            toast({ title: "Error", description: message, variant: "destructive" })
        } finally {
            setIsSubmitting(false)
        }
    }


    return (
        <Form {...form}>
            {step === 'form' ? (
                <form onSubmit={form.handleSubmit(createPayment)} className="space-y-6">
                    {/* Donation Type */}
                    <FormField
                        control={form.control}
                        name="donationType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Donation Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a donation type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {donationTypes.map((type) => (
                                            <SelectItem key={type.id} value={type.id}>
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Donation Frequency*/}
                    <FormField
                        control={form.control}
                        name="donationFrequency"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Donation Frequency</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="one-time">One-Time</SelectItem>
                                        <SelectItem value="monthly">Monthly (Recurring)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />


                    {/* Amount */}
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                    <FormControl>
                                        <Input {...field} type="number" min="1" step="0.01" className="pl-7" />
                                    </FormControl>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Quick Amounts */}
                    <div>
                        <label className="text-sm font-medium">Quick Amounts</label>
                        <div className="grid grid-cols-3 gap-3 mt-1">
                            {[25, 50, 100, 200, 500, 1000].map((amount) => (
                                <Button
                                    key={amount}
                                    type="button"
                                    variant="outline"
                                    onClick={() => form.setValue('amount', amount.toString())}
                                >
                                    ${amount}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Name */}
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Email & Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="email" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number (Optional)</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="tel" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Continue to Payment */}
                    <Button
                        type="submit"
                        className="w-full bg-blue-600 text-white hover:bg-blue-700 py-6 text-lg"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Processing..." : "Continue to Payment"}
                    </Button>
                </form>
            ) : clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <PaymentForm
                        email={form.getValues('email')}
                        setIsSubmitting={setIsSubmitting}
                        isSubmitting={isSubmitting}
                        paymentElementReady={paymentElementReady}
                        setPaymentElementReady={setPaymentElementReady}
                    />
                </Elements>
            ) : null}
        </Form>
    )
}

function PaymentForm({
    email,
    isSubmitting,
    setIsSubmitting,
    paymentElementReady,
    setPaymentElementReady
}: {
    email: string
    isSubmitting: boolean
    setIsSubmitting: (v: boolean) => void
    paymentElementReady: boolean
    setPaymentElementReady: (v: boolean) => void
}) {
    const stripe = useStripe()
    const elements = useElements()
    const { toast } = useToast()

    async function handlePaymentSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!stripe || !elements || !paymentElementReady) {
            toast({
                title: "Payment not ready",
                description: "Please wait for the payment form to finish loading",
                variant: "destructive"
            })
            return
        }

        setIsSubmitting(true)

        try {
            const result = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/donations/thank-you`,
                    receipt_email: email,
                },
                redirect: 'always',
            })

            if (result.error) {
                throw result.error
            }

        } catch (err: unknown) {
            const message =
                err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string"
                    ? (err as { message: string }).message
                    : "An error occurred";
            toast({
                title: "Payment Error",
                description: message,
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handlePaymentSubmit} className="space-y-6">
            <div className="border rounded-lg p-4">
                <PaymentElement
                    onReady={() => {
                        console.log("PaymentElement is ready")
                        setPaymentElementReady(true)
                    }}
                    options={{
                        layout: 'tabs',
                        wallets: { applePay: 'auto', googlePay: 'auto' },
                    }}
                />
            </div>

            <Button
                type="submit"
                className="w-full bg-blue-600 text-white hover:bg-blue-700 py-6 text-lg"
                disabled={!stripe || !paymentElementReady || isSubmitting}
            >
                {isSubmitting ? "Processing Payment..." : "Complete Donation"}
            </Button>
        </form>
    )
}
