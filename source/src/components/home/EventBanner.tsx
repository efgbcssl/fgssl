"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Calendar, ArrowRight } from 'lucide-react'

type Event = {
  id: string
  title: string
  description?: string
  date: string
  time: string
  location: string
  imageSrc: string
  ctaText: string
  ctaLink: string
  order: number
  expiresAt: string
}

export default function EventBanner({ events }: { events: Event[] }) {
  const [currentEventIndex, setCurrentEventIndex] = useState(0)
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])

  useEffect(() => {
    // Filter out expired events and sort by order
    const now = new Date()
    const validEvents = events
      .filter(event => new Date(event.expiresAt) > now)
      .sort((a, b) => a.order - b.order)

    setFilteredEvents(validEvents)
    setCurrentEventIndex(0)
  }, [events])

  useEffect(() => {
    if (filteredEvents.length <= 1) return

    const interval = setInterval(() => {
      setCurrentEventIndex((prev) =>
        prev === filteredEvents.length - 1 ? 0 : prev + 1
      )
    }, 8000)

    return () => clearInterval(interval)
  }, [filteredEvents])

  if (filteredEvents.length === 0) return null

  const currentEvent = filteredEvents[currentEventIndex]

  return (
    <section className="relative bg-church-primary text-white overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <Image
          src={currentEvent.imageSrc}
          alt="Event background"
          fill
          sizes="100vw"
          className="object-cover opacity-40"
          priority
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-church-primary/60 to-church-primary/90" />

      <div className="container-custom relative z-10 py-10 md:py-16">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0 md:max-w-xl">
            <Badge variant="featured" />
            <h2 className="text-2xl md:text-3xl font-bold font-heading mb-3">
              {currentEvent.title}
            </h2>
            <div className="flex items-center text-church-secondary mb-3">
              <Calendar className="h-5 w-5 mr-2" />
              <span className="font-medium">
                {currentEvent.date} • {currentEvent.time}
              </span>
            </div>
            <p className="mb-2 text-gray-100">
              Location: {currentEvent.location}
            </p>
            {currentEvent.description && (
              <p className="mb-4 text-gray-100">{currentEvent.description}</p>
            )}
            <Button className="bg-church-secondary text-church-dark hover:bg-church-secondary/90 group"
              onClick={() => window.open(currentEvent.ctaLink, '_blank')}>
              {currentEvent.ctaText}
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {filteredEvents.length > 1 && (
            <div className="flex space-x-2">
              {filteredEvents.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentEventIndex(idx)}
                  className={`w-3 h-3 rounded-full ${idx === currentEventIndex
                    ? 'bg-church-secondary'
                    : 'bg-white/30 hover:bg-white/50'
                    } transition-colors`}
                  aria-label={`View event ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function Badge({ variant = "default" }: { variant?: string }) {
  return (
    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-church-secondary text-church-dark uppercase tracking-wide mb-4">
      Featured Event
    </span>
  )
}