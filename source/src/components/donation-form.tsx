// components/donation-form.tsx
"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/hooks/use-toast'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const FormSchema = z.object({
    donationType: z.string().min(1, "Please select a donation type"),
    amount: z.string().min(1, "Please enter an amount"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    phone: z.string().optional(),
    paymentMethod: z.string().min(1, "Please select a payment method"),
})

type DonationType = { id: string; name: string };

export function DonationForm({ donationTypes }: { donationTypes: DonationType[] }) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { toast } = useToast()
    const stripe = useStripe()
    const elements = useElements()

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            donationType: "",
            amount: "",
            name: "",
            email: "",
            phone: "",
            paymentMethod: "card",
        },
    })

    async function onSubmit(values: z.infer<typeof FormSchema>) {
        if (!stripe || !elements) {
            toast({
                title: "Payment system not ready",
                description: "Please wait while we initialize the payment system",
                variant: "destructive"
            })
            return
        }

        setIsSubmitting(true)

        try {
            // First create or update the payment intent with the actual amount
            const response = await fetch('/api/stripe/update-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: Math.round(Number(values.amount) * 100),
                    currency: 'usd',
                    metadata: {
                        donationType: values.donationType,
                        donorName: values.name,
                        donorEmail: values.email,
                    }
                }),
            })

            if (!response.ok) throw new Error('Failed to update payment amount')

            // Then confirm the payment
            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/donations/thank-you`,
                    receipt_email: values.email,
                    payment_method_data: {
                        billing_details: {
                            name: values.name,
                            email: values.email,
                            phone: values.phone || undefined,
                        },
                    }
                }
            })

            if (error) {
                throw error
            }
        } catch (err: unknown) {
            let message = "An error occurred during payment";
            if (err instanceof Error) {
                message = err.message;
            }
            toast({
                title: "Payment Failed",
                description: message,
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                        <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                                    ))}
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

                {/* Quick Amount Buttons */}
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

                {/* Contact Info */}
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

                {/* Payment Element */}
                <div className="border rounded-lg p-4">
                    <PaymentElement
                        options={{
                            wallets: {
                                applePay: 'auto',
                                googlePay: 'auto'
                            }
                        }}
                    />
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 py-6 text-lg"
                    disabled={isSubmitting || !stripe}
                >
                    {isSubmitting ? "Processing Donation..." : "Complete Donation"}
                </Button>

                <p className="text-center text-sm text-gray-500">
                    Your donation is secure and tax-deductible. You will receive a receipt by email.
                </p>
            </form>
        </Form>
    )
}