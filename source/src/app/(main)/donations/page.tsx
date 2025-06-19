"use client"

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Heart, Gift, Building, GraduationCap, HandHeart, Lightbulb } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { StripeProvider } from '@/components/stripe-provider'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const donationTypes = [
    {
        id: 'tithe',
        name: 'Tithe',
        description: 'Regular giving of 10% of your income',
        icon: Heart
    },
    {
        id: 'offering',
        name: 'Offering',
        description: 'General donations to support church operations',
        icon: Gift
    },
    {
        id: 'building',
        name: 'Building Fund',
        description: 'Support church facility improvements',
        icon: Building
    },
    {
        id: 'missions',
        name: 'Missions',
        description: 'Support our local and global mission work',
        icon: HandHeart
    },
    {
        id: 'education',
        name: 'Education',
        description: 'Support our Sunday School and Bible study programs',
        icon: GraduationCap
    },
    {
        id: 'special',
        name: 'Special Projects',
        description: 'Funding for special community initiatives',
        icon: Lightbulb
    },
]

const FormSchema = z.object({
    donationType: z.string().min(1, "Please select a donation type"),
    amount: z.string().min(1, "Please enter an amount"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    phone: z.string().optional(),
    paymentMethod: z.string().min(1, "Please select a payment method"),
})

// Add this export to disable prerendering
export const dynamic = 'force-dynamic'

export default function DonationPage() {
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
                title: "Stripe not loaded",
                description: "Please try again later.",
                variant: "destructive"
            })
            return
        }

        setIsSubmitting(true)

        try {
            // Call your backend to create a PaymentIntent
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: parseFloat(values.amount) * 100, // Convert to cents
                    currency: 'usd',
                    metadata: {
                        donationType: values.donationType,
                        donorName: values.name,
                        donorEmail: values.email,
                    }
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to create payment intent')
            }

            const { clientSecret } = await response.json()

            // Confirm the payment with Stripe
            const { error } = await stripe.confirmPayment({
                elements,
                clientSecret,
                confirmParams: {
                    return_url: `${window.location.origin}/donation/thank-you`,
                    receipt_email: values.email,
                },
            })

            if (error) {
                toast({
                    title: "Payment Failed",
                    description: error.message,
                    variant: "destructive"
                })
            } else {
                toast({
                    title: "Donation Successful",
                    description: `Thank you for your ${values.donationType} donation of $${values.amount}. A receipt has been sent to your email.`,
                })
            }
        } catch (error) {
            console.error('Erro while processing payment.', error)
            toast({
                title: "Error",
                description: "An error occurred while processing your donation. Please try again.",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <StripeProvider>
                {/* Hero Section */}
                <section className="relative h-[300px] md:h-[350px] overflow-hidden">
                    <Image
                        src="https://images.pexels.com/photos/6647037/pexels-photo-6647037.jpeg"
                        alt="Donation"
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="container-custom relative z-10 h-full flex flex-col justify-center items-center text-center text-white">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-heading">
                            Support Our Ministry
                        </h1>
                        <p className="text-lg max-w-2xl">
                            Your generosity makes a difference in our church and community
                        </p>
                    </div>
                </section>

                {/* Donation Types */}
                <section className="py-16">
                    <div className="container-custom">
                        <h2 className="section-title centered">Ways to Give</h2>
                        <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
                            Your financial support enables us to continue our mission of spreading the gospel,
                            caring for those in need, and building a community of faith.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {donationTypes.map((type) => (
                                <Card key={type.id} className="card-hover">
                                    <CardContent className="p-6">
                                        <div className="flex flex-col items-center text-center">
                                            <div className="h-14 w-14 flex items-center justify-center rounded-full bg-church-primary/10 text-church-primary mb-4">
                                                <type.icon className="h-7 w-7" />
                                            </div>
                                            <h3 className="text-xl font-bold mb-2 font-heading">{type.name}</h3>
                                            <p className="text-gray-600 mb-4">{type.description}</p>
                                            <Button
                                                variant="outline"
                                                className="border-church-primary text-church-primary mt-auto"
                                                onClick={() => {
                                                    form.setValue('donationType', type.id)
                                                    const donationForm = document.getElementById('donation-form')
                                                    if (donationForm) {
                                                        donationForm.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                                    }
                                                }}
                                            >
                                                Give Now
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Donation Form */}
                <section className="py-16 bg-gray-50" id="donation-form">
                    <div className="container-custom">
                        <div className="max-w-3xl mx-auto">
                            <h2 className="section-title centered">Make a Donation</h2>
                            <p className="text-center text-gray-600 mb-10">
                                Fill out the form below to make a secure online donation.
                            </p>

                            <Card>
                                <CardContent className="p-6 md:p-8">
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

                                            {/* Payment Method */}
                                            <FormField
                                                control={form.control}
                                                name="paymentMethod"
                                                render={({ field }) => (
                                                    <FormItem className="space-y-3">
                                                        <FormLabel>Payment Method</FormLabel>
                                                        <FormControl>
                                                            <RadioGroup
                                                                onValueChange={field.onChange}
                                                                defaultValue={field.value}
                                                                className="flex flex-col space-y-1"
                                                            >
                                                                <div className="flex items-center space-x-2">
                                                                    <RadioGroupItem value="card" id="card" />
                                                                    <Label htmlFor="card">Credit/Debit Card</Label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <RadioGroupItem value="paypal" id="paypal" />
                                                                    <Label htmlFor="paypal">PayPal</Label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <RadioGroupItem value="bank" id="bank" />
                                                                    <Label htmlFor="bank">Bank Transfer</Label>
                                                                </div>
                                                            </RadioGroup>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {/* Stripe Payment Element */}
                                            {form.watch('paymentMethod') !== 'bank' && (
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
                                            )}

                                            {/* Bank Transfer Info (shown when selected) */}
                                            {form.watch('paymentMethod') === 'bank' && (
                                                <div className="border rounded-lg p-4 space-y-2">
                                                    <h3 className="font-medium">Bank Transfer Instructions</h3>
                                                    <p className="text-sm text-gray-600">
                                                        Please transfer your donation to:
                                                    </p>
                                                    <div className="bg-gray-50 p-3 rounded-md text-sm">
                                                        <p><strong>Bank Name:</strong> Your Church Bank</p>
                                                        <p><strong>Account Name:</strong> Your Church Name</p>
                                                        <p><strong>Account Number:</strong> 123456789</p>
                                                        <p><strong>Routing Number:</strong> 987654321</p>
                                                        <p><strong>Reference:</strong> Donation - {form.watch('donationType') || 'General'}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Submit Button */}
                                            <Button
                                                type="submit"
                                                className="w-full bg-church-primary text-white hover:bg-church-primary/90 py-6 text-lg"
                                                disabled={isSubmitting || !stripe}
                                            >
                                                {isSubmitting ? "Processing Donation..." : "Complete Donation"}
                                            </Button>

                                            <p className="text-center text-sm text-gray-500">
                                                Your donation is secure and tax-deductible. You will receive a receipt by email.
                                            </p>
                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* Impact Stories */}
                <section className="py-16">
                    <div className="container-custom">
                        <h2 className="section-title centered">Your Giving Makes a Difference</h2>
                        <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
                            See how your generous donations have impacted lives in our church and community.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                {
                                    title: "Community Food Pantry",
                                    image: "https://images.pexels.com/photos/6590920/pexels-photo-6590920.jpeg",
                                    description: "Your donations helped us serve over 500 families through our food pantry ministry last year."
                                },
                                {
                                    title: "Youth Camp Scholarships",
                                    image: "https://images.pexels.com/photos/3823207/pexels-photo-3823207.jpeg",
                                    description: "We were able to provide scholarships for 25 youth to attend our annual summer camp."
                                },
                                {
                                    title: "Building Renovations",
                                    image: "https://images.pexels.com/photos/3281251/pexels-photo-3281251.jpeg",
                                    description: "Thanks to your generosity, we completed renovations to make our facilities more accessible."
                                }
                            ].map((story, index) => (
                                <Card key={index} className="overflow-hidden card-hover">
                                    <div className="relative h-48">
                                        <Image
                                            src={story.image}
                                            alt={story.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            className="object-cover"
                                        />
                                    </div>
                                    <CardContent className="p-6">
                                        <h3 className="text-xl font-bold mb-2 font-heading">{story.title}</h3>
                                        <p className="text-gray-600">{story.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
            </StripeProvider>
        </>

    )
}