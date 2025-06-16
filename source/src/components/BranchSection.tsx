'use client'

import { useEffect, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { Clock, Navigation } from 'lucide-react'
import { Button } from './ui/button'

interface BranchMapProps {
    branchLocation: { lat: number; lng: number }
    branchName: string
}

export default function BranchMap({ branchLocation, branchName }: BranchMapProps) {
    const [map, setMap] = useState<google.maps.Map | null>(null)
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [travelInfo, setTravelInfo] = useState<{ duration: string; distance: string } | null>(null)

    useEffect(() => {
        const loader = new Loader({
            apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
            libraries: ['places', 'geometry'],
            version: 'weekly'
        })

        loader.load().then(() => {
            const mapElement = document.getElementById('branch-map')
            if (mapElement) {
                const newMap = new google.maps.Map(mapElement, {
                    center: branchLocation,
                    zoom: 14,
                    styles: [
                        {
                            featureType: "poi",
                            elementType: "labels",
                            stylers: [{ visibility: "off" }]
                        }
                    ]
                })

                // Add branch marker
                new google.maps.Marker({
                    position: branchLocation,
                    map: newMap,
                    title: branchName,
                    icon: {
                        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                        scaledSize: new google.maps.Size(32, 32)
                    }
                })

                setMap(newMap)
            }
        })

        // Get user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }
                    setUserLocation(location)
                },
                (error) => console.error("Geolocation error:", error),
                { enableHighAccuracy: true }
            )
        }
    }, [branchLocation, branchName])

    useEffect(() => {
        if (map && userLocation) {
            // Add user location marker
            new google.maps.Marker({
                position: userLocation,
                map,
                title: "Your Location",
                icon: {
                    url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                    scaledSize: new google.maps.Size(32, 32)
                }
            })

            // Draw route
            const directionsService = new google.maps.DirectionsService()
            const directionsRenderer = new google.maps.DirectionsRenderer({
                map,
                suppressMarkers: true,
                polylineOptions: {
                    strokeColor: '#4F46E5',
                    strokeOpacity: 0.8,
                    strokeWeight: 4
                }
            })

            directionsService.route({
                origin: userLocation,
                destination: branchLocation,
                travelMode: google.maps.TravelMode.DRIVING
            }, (result, status) => {
                if (status === 'OK') {
                    directionsRenderer.setDirections(result)
                    if (result?.routes[0]?.legs[0]) {
                        setTravelInfo({
                            duration: result.routes[0].legs[0].duration?.text || '',
                            distance: result.routes[0].legs[0].distance?.text || ''
                        })
                    }
                }
            })
        }
    }, [map, userLocation, branchLocation])

    return (
        <div className="h-full relative">
            <div id="branch-map" className="h-full w-full"></div>
            {travelInfo && (
                <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md z-10">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-church-primary" />
                        <span className="text-sm font-medium">{travelInfo.duration} ({travelInfo.distance})</span>
                    </div>
                </div>
            )}
            <div className="absolute top-4 right-4 z-10">
                <Button
                    size="sm"
                    variant="outline"
                    className="bg-white/90 backdrop-blur-sm"
                    onClick={() => {
                        if (userLocation) {
                            window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${branchLocation.lat},${branchLocation.lng}&travelmode=driving`)
                        }
                    }}
                >
                    <Navigation className="h-4 w-4 mr-2" />
                    Navigate
                </Button>
            </div>
        </div>
    )
}