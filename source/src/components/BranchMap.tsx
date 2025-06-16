'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { Clock, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function BranchMap({ branchLocation, branchName }: any) {
    const mapRef = useRef<HTMLDivElement>(null)
    const [travelInfo, setTravelInfo] = useState<{ duration: string, distance: string } | null>(null)

    useEffect(() => {
        const loader = new Loader({
            apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
            libraries: ['geometry']
        })

        loader.load().then(() => {
            if (mapRef.current) {
                const map = new google.maps.Map(mapRef.current, {
                    center: branchLocation,
                    zoom: 14,
                    disableDefaultUI: true
                })

                new google.maps.Marker({
                    position: branchLocation,
                    map,
                    title: branchName
                })

                // Get user location and show route
                navigator.geolocation?.getCurrentPosition((pos) => {
                    const userLocation = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    }

                    new google.maps.Marker({
                        position: userLocation,
                        map,
                        icon: {
                            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                        }
                    })

                    const directionsService = new google.maps.DirectionsService()
                    const directionsRenderer = new google.maps.DirectionsRenderer({
                        map,
                        suppressMarkers: true
                    })

                    directionsService.route({
                        origin: userLocation,
                        destination: branchLocation,
                        travelMode: google.maps.TravelMode.DRIVING
                    }, (result) => {
                        directionsRenderer.setDirections(result)
                        if (result.routes[0].legs[0]) {
                            setTravelInfo({
                                duration: result.routes[0].legs[0].duration?.text || '',
                                distance: result.routes[0].legs[0].distance?.text || ''
                            })
                        }
                    })
                })
            }
        })
    }, [branchLocation, branchName])

    return (
        <div className="relative h-full">
            <div ref={mapRef} className="h-full w-full rounded-md" />
            {travelInfo && (
                <div className="absolute bottom-4 left-4 bg-white/90 p-2 rounded-md shadow-sm">
                    <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-4 w-4" />
                        {travelInfo.duration} ({travelInfo.distance})
                    </div>
                </div>
            )}
            <Button
                className="absolute top-4 right-4"
                size="sm"
                variant="outline"
                onClick={() => {
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${branchLocation.lat},${branchLocation.lng}`)
                }}
            >
                <Navigation className="h-4 w-4 mr-2" />
                Directions
            </Button>
        </div>
    )
}