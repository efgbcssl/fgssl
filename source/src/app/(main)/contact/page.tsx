"use client"

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { MapPin, Phone, Mail, Clock, ExternalLink } from 'lucide-react'
import AppointmentForm from '@/components/home/AppointmentForm'

export default function ContactPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Simulate API call
        setTimeout(() => {
            toast({
                title: "Message Sent",
                description: "Your message has been received. We'll get back to you soon!",
            })
            setIsSubmitting(false)
            // Reset the form
            const form = e.target as HTMLFormElement
            form.reset()
        }, 1000)
    }

    return (
        <>
            {/* Hero Section */}
            <section className="relative h-[300px] md:h-[350px] overflow-hidden">
                <Image
                    src="https://images.pexels.com/photos/934718/pexels-photo-934718.jpeg"
                    alt="Contact Us"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="container-custom relative z-10 h-full flex flex-col justify-center items-center text-center text-white">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-heading">
                        Contact Us
                    </h1>
                    <p className="text-lg max-w-2xl">
                        We'd love to hear from you! Reach out with any questions or prayer requests.
                    </p>
                </div>
            </section>

            {/* Contact Info & Form Section */}
            <section className="py-16">
                <div className="container-custom">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Contact Information */}
                        <div>
                            <h2 className="section-title mb-8">Get In Touch</h2>

                            <div className="space-y-8">
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-start">
                                            <div className="h-10 w-10 rounded-full bg-church-primary/10 flex items-center justify-center mr-4 flex-shrink-0">
                                                <MapPin className="h-5 w-5 text-church-primary" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold mb-1">Our Address</h3>
                                                <p className="text-gray-700">123 Faith Street, Grace City, GC 12345</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-start">
                                            <div className="h-10 w-10 rounded-full bg-church-primary/10 flex items-center justify-center mr-4 flex-shrink-0">
                                                <Phone className="h-5 w-5 text-church-primary" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold mb-1">Phone</h3>
                                                <p className="text-gray-700">Main Office: (123) 456-7890</p>
                                                <p className="text-gray-700">Prayer Line: (123) 456-7891</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-start">
                                            <div className="h-10 w-10 rounded-full bg-church-primary/10 flex items-center justify-center mr-4 flex-shrink-0">
                                                <Mail className="h-5 w-5 text-church-primary" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold mb-1">Email</h3>
                                                <p className="text-gray-700">General Inquiries: info@gracechurch.org</p>
                                                <p className="text-gray-700">Prayer Requests: prayer@gracechurch.org</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-start">
                                            <div className="h-10 w-10 rounded-full bg-church-primary/10 flex items-center justify-center mr-4 flex-shrink-0">
                                                <Clock className="h-5 w-5 text-church-primary" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold mb-1">Office Hours</h3>
                                                <p className="text-gray-700">Monday - Friday: 9:00 AM - 5:00 PM</p>
                                                <p className="text-gray-700">Saturday: Closed</p>
                                                <p className="text-gray-700">Sunday: 8:00 AM - 1:00 PM</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div>
                            <h2 className="section-title mb-8">Send a Message</h2>
                            <Card>
                                <CardContent className="p-6 md:p-8">
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Full Name</Label>
                                                <Input id="name" required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email Address</Label>
                                                <Input id="email" type="email" required />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="subject">Subject</Label>
                                            <Input id="subject" required />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="message">Message</Label>
                                            <Textarea id="message" rows={5} required />
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full bg-church-primary text-white hover:bg-church-primary/90"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? "Sending..." : "Send Message"}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* Map Section */}
            <section className="py-16 bg-gray-50">
                <div className="container-custom">
                    <h2 className="section-title centered">Find Us</h2>
                    <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
                        We're conveniently located in the heart of Grace City. Join us for Sunday services or stop by our office during the week.
                    </p>

                    <div className="relative h-[400px] rounded-lg overflow-hidden card-hover">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.215249797735!2d-73.9878531!3d40.7484405!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259a9aeb1c6b5%3A0x35b1cfbc89a6097f!2sEmpire%20State%20Building!5e0!3m2!1sen!2sus!4v1650397147464!5m2!1sen!2sus"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                        ></iframe>
                        <div className="absolute bottom-4 right-4">
                            <Button asChild className="bg-church-primary text-white hover:bg-church-primary/90 shadow-md">
                                <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Get Directions
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Appointment Form Section */}
            <AppointmentForm />
        </>
    )
}