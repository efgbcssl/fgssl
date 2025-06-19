"use client"

import dynamic from 'next/dynamic'
import { Heart, Gift, Building, GraduationCap, HandHeart, Lightbulb } from 'lucide-react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

// Define donationTypes array
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

// Dynamically import the Stripe provider and form components
const StripeProvider = dynamic(
    () => import('@/components/stripe-provider').then((mod) => mod.StripeProvider),
    {
        ssr: false,
        loading: () => <div className="text-center py-8">Initializing secure payment system...</div>
    }
)

const DonationForm = dynamic(
    () => import('@/components/donation-form').then((mod) => mod.DonationForm),
    {
        ssr: false,
        loading: () => <div className="text-center py-8">Loading donation form...</div>
    }
)

export default function DonationPage() {
    const { toast } = useToast()

    return (
        <>
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
                    <h2 className="text-3xl font-bold text-center mb-4 font-heading">Ways to Give</h2>
                    <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
                        Your financial support enables us to continue our mission of spreading the gospel,
                        caring for those in need, and building a community of faith.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {donationTypes.map((type) => (
                            <Card key={type.id} className="hover:shadow-lg transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="h-14 w-14 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-4">
                                            <type.icon className="h-7 w-7" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2 font-heading">{type.name}</h3>
                                        <p className="text-gray-600 mb-4">{type.description}</p>
                                        <Button
                                            variant="outline"
                                            className="border-blue-600 text-blue-600 mt-auto"
                                            onClick={() => {
                                                const donationForm = document.getElementById('donation-form')
                                                if (donationForm) {
                                                    donationForm.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                                }
                                                toast({
                                                    title: "Ready to Give",
                                                    description: `You've selected ${type.name} donation. Thank you!`,
                                                })
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
                        <h2 className="text-3xl font-bold text-center mb-4 font-heading">Make a Donation</h2>
                        <p className="text-center text-gray-600 mb-10">
                            Fill out the form below to make a secure online donation.
                        </p>

                        <Card>
                            <CardContent className="p-6 md:p-8">
                                <StripeProvider>
                                    <DonationForm donationTypes={donationTypes} />
                                </StripeProvider>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Impact Stories */}
            <section className="py-16">
                <div className="container-custom">
                    <h2 className="text-3xl font-bold text-center mb-4 font-heading">Your Giving Makes a Difference</h2>
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
                            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
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
        </>
    )
}