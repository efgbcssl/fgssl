"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { MapPin, Phone, Mail, Clock, ExternalLink, Navigation, Loader2 } from 'lucide-react'
import AppointmentForm from '@/components/home/AppointmentForm'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

const CHURCH_ADDRESS = "914 Silver Spring Avenue Suite 204B, Silver Spring, MD 20910"
const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
const CHURCH_COORDS = { lat: 38.9907, lng: -77.0261 }

export default function ContactPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [mapLoaded, setMapLoaded] = useState(false)
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [travelInfo, setTravelInfo] = useState<{
        distance: string
        duration: string
        mode: 'driving' | 'walking' | 'transit'
    } | null>(null)
    const [loadingTravelInfo, setLoadingTravelInfo] = useState(false)
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

    const getDirections = () => {
        if (!userLocation) {
            toast({
                title: "Location Required",
                description: "Please allow location access to get directions",
                variant: "destructive"
            })
            return
        }

        const destination = encodeURIComponent(CHURCH_ADDRESS)
        const origin = encodeURIComponent(`${userLocation.lat},${userLocation.lng}`)
        window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${travelInfo?.mode || 'driving'}`)
    }

    const calculateTravelTime = async () => {
        if (!userLocation || !window.google) return

        setLoadingTravelInfo(true)

        try {
            const service = new google.maps.DistanceMatrixService()
            const response = await service.getDistanceMatrix({
                origins: [new google.maps.LatLng(userLocation.lat, userLocation.lng)],
                destinations: [new google.maps.LatLng(CHURCH_COORDS.lat, CHURCH_COORDS.lng)],
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.IMPERIAL,
            })

            if (response.rows[0].elements[0].status === "OK") {
                const { distance, duration } = response.rows[0].elements[0]
                if (distance && duration) {
                    setTravelInfo({
                        distance: distance.text,
                        duration: duration.text,
                        mode: 'driving'
                    })
                }
            }
        } catch (error) {
            console.error("Error calculating travel time:", error)
        } finally {
            setLoadingTravelInfo(false)
        }
    }

    useEffect(() => {
        // Load Google Maps script
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_API_KEY}&libraries=places,geometry&callback=initMap`
        script.async = true
        script.defer = true
        script.onload = () => setMapLoaded(true)
        document.head.appendChild(script)

        // Get user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    })
                },
                (error) => {
                    console.error("Geolocation error:", error)
                }
            )
        }

        return () => {
            document.head.removeChild(script)
        }
    }, [])

    useEffect(() => {
        if (mapLoaded && userLocation) {
            initMap()
            calculateTravelTime()
        }
    }, [mapLoaded, userLocation])

    const initMap = () => {
        const map = new google.maps.Map(document.getElementById("map") as HTMLElement, {
            center: CHURCH_COORDS,
            zoom: 15,
            styles: [
                {
                    "featureType": "poi",
                    "elementType": "labels",
                    "stylers": [{ "visibility": "off" }]
                },
                {
                    "featureType": "transit",
                    "elementType": "labels",
                    "stylers": [{ "visibility": "off" }]
                },
                {
                    "featureType": "water",
                    "elementType": "labels.text",
                    "stylers": [{ "visibility": "off" }]
                }
            ]
        })

        new google.maps.Marker({
            position: CHURCH_COORDS,
            map,
            title: "EFGBC Silver Spring",
            icon: {
                url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                scaledSize: new google.maps.Size(40, 40)
            }
        })

        if (userLocation) {
            new google.maps.Marker({
                position: { lat: userLocation.lat, lng: userLocation.lng },
                map,
                title: "Your Location",
                icon: {
                    url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                    scaledSize: new google.maps.Size(40, 40)
                }
            })

            new google.maps.Polyline({
                path: [
                    { lat: userLocation.lat, lng: userLocation.lng },
                    CHURCH_COORDS
                ],
                geodesic: true,
                strokeColor: "#FF0000",
                strokeOpacity: 0.7,
                strokeWeight: 3,
                map: map
            })
        }
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
                        We&apos;d love to hear from you! Reach out with any questions or prayer requests.
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
                                                <p className="text-gray-700">{CHURCH_ADDRESS}</p>
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
            <section className="py-16 bg-gray-50 dark:bg-gray-800">
                <div className="container-custom">
                    <h2 className="section-title centered">Find Us</h2>
                    <p className="text-center text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
                        We&apos;re conveniently located in Silver Spring. Join us for Sunday services or stop by our office during the week.
                    </p>

                    <div className="relative h-[400px] rounded-lg overflow-hidden card-hover shadow-lg">
                        {!mapLoaded ? (
                            <Skeleton className="h-full w-full" />
                        ) : (
                            <>
                                <div id="map" className="h-full w-full"></div>

                                {/*Travel Info Display */}

                                {/* Travel Info Display */}
                                {travelInfo && (
                                    <div className="absolute top-4 left-4 bg-white dark:bg-gray-900 p-3 rounded-lg shadow-md">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Clock className="h-4 w-4 text-church-primary" />
                                            <span className="font-medium">Estimated travel time:</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge variant="outline" className="border-church-primary text-church-primary">
                                                {travelInfo.duration}
                                            </Badge>
                                            <Badge variant="outline">
                                                {travelInfo.distance}
                                            </Badge>
                                        </div>
                                    </div>
                                )}

                                {/*Map Controls */}
                                <div className="absolute bottom-4 right-4 flex gap-2">
                                    <Button
                                        onClick={getDirections}
                                        className="bg-church-primary text-white hover:bg-church-primary/90 shadow-md flex items-center"
                                        disabled={loadingTravelInfo}
                                    >
                                        {loadingTravelInfo ? (
                                            <>
                                                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                                Calculating...
                                            </>
                                        ) : (
                                            <>


                                                <Navigation className="h-4 w-4 mr-2" />
                                                {userLocation ? "Get Directions" : "Allow Location"}
                                            </>
                                        )}
                                    </Button>
                                    <Button asChild className="bg-white text-gray-800 hover:bg-gray-100 shadow-mddark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
                                        <a
                                            href={`https://www.google.com/maps?q=${encodeURIComponent(CHURCH_ADDRESS)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            View Map
                                        </a>
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Appointment Form Section */}
            <AppointmentForm />
        </>
    )
}