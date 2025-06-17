// components/HeroSlider.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid'
import type { StaticImageData } from 'next/image'
import slide1 from '@/assets/images/slide1.jpg'
import slide2 from './../assets/images/slide2.jpg'
import slide3 from './../assets/images/slide3.jpg'
import slide4 from './../assets/images/slide4.jpg'
import slide5 from './../assets/images/slide5.jpg'

// Type for slide data
interface Slide {
    id: number
    title: string
    subtitle: string
    image: StaticImageData | string
    cta: string
    verse: string
}

const slides: Slide[] = [
    {
        id: 1,
        title: "Welcome to Our Church Family",
        subtitle: "Where Faith, Hope, and Love Come Together",
        image: slide1,
        cta: "Join Us This Sunday",
        verse: "Matthew 18:20 - 'For where two or three gather in my name, there am I with them.'"
    },
    {
        id: 2,
        title: "Sunday Worship Service",
        subtitle: "Every Sunday at 9:00 AM & 11:00 AM",
        image: slide2,
        cta: "Service Times",
        verse: "Psalm 95:6 - 'Come, let us bow down in worship, let us kneel before the Lord our Maker.'"
    },
    {
        id: 3,
        title: "Children's Ministry",
        subtitle: "Nurturing Young Hearts in God's Love",
        image: slide3,
        cta: "Learn More",
        verse: "Proverbs 22:6 - 'Train up a child in the way he should go; even when he is old he will not depart from it.'"
    },
    {
        id: 4,
        title: "Community Outreach",
        subtitle: "Serving Our Neighborhood With Compassion",
        image: slide4,
        cta: "Get Involved",
        verse: "Galatians 5:13 - 'Serve one another humbly in love.'"
    },
    {
        id: 5,
        title: "Bible Study Groups",
        subtitle: "Growing Together in God's Word",
        image: slide5,
        cta: "Find a Group",
        verse: "2 Timothy 3:16 - 'All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness.'"
    }
]

export default function HeroSlider() {
    const [currentSlide, setCurrentSlide] = useState(0)
    const [direction, setDirection] = useState(0) // -1 for left, 1 for right
    const [autoPlay, setAutoPlay] = useState(true)

    const goToNext = useCallback(() => {
        setDirection(1)
        setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
    }, [])

    const goToPrev = () => {
        setDirection(-1)
        setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
    }

    const goToSlide = (index: number) => {
        setDirection(index > currentSlide ? 1 : -1)
        setCurrentSlide(index)
    }

    useEffect(() => {
        if (!autoPlay) return

        const interval = setInterval(() => {
            goToNext()
        }, 7000)

        return () => clearInterval(interval)
    }, [autoPlay, goToNext])

    // Animation variants
    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            x: direction < 0 ? '100%' : '-100%',
            opacity: 0
        })
    }

    return (
        <section className="relative w-full h-[80vh] max-h-[800px] overflow-hidden">
            <div
                className="absolute inset-0 bg-black/30 z-10"
                aria-hidden="true"
            />

            <AnimatePresence custom={direction} initial={false}>
                <motion.div
                    key={slides[currentSlide].id}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: 'spring', stiffness: 300, damping: 30 },
                        opacity: { duration: 0.4 }
                    }}
                    className="absolute inset-0 w-full h-full"
                >
                    {/* Background Image */}
                    <div
                        className="absolute inset-0 w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${typeof slides[currentSlide].image === 'string' ? slides[currentSlide].image : slides[currentSlide].image.src})` }}
                    />

                    {/* Content */}
                    <div className="relative z-20 h-full flex flex-col justify-center items-center text-center text-white px-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="max-w-4xl mx-auto"
                        >
                            <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">
                                {slides[currentSlide].title}
                            </h1>
                            <p className="text-xl md:text-2xl mb-6 drop-shadow-md">
                                {slides[currentSlide].subtitle}
                            </p>
                            <p className="italic mb-8 drop-shadow-md">
                                {slides[currentSlide].verse}
                            </p>
                            <button
                                className="bg-white text-gray-900 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors duration-300 shadow-lg"
                                onMouseEnter={() => setAutoPlay(false)}
                                onMouseLeave={() => setAutoPlay(true)}
                            >
                                {slides[currentSlide].cta}
                            </button>
                        </motion.div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            <button
                onClick={goToPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/30 hover:bg-white/50 p-2 rounded-full transition-colors duration-300"
                aria-label="Previous slide"
                onMouseEnter={() => setAutoPlay(false)}
                onMouseLeave={() => setAutoPlay(true)}
            >
                <ChevronLeftIcon className="w-8 h-8 text-white" />
            </button>
            <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/30 hover:bg-white/50 p-2 rounded-full transition-colors duration-300"
                aria-label="Next slide"
                onMouseEnter={() => setAutoPlay(false)}
                onMouseLeave={() => setAutoPlay(true)}
            >
                <ChevronRightIcon className="w-8 h-8 text-white" />
            </button>

            {/* Dots Navigation */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                {slides.map((slide, index) => (
                    <button
                        key={slide.id}
                        onClick={() => goToSlide(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === index ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/70'}`}
                        aria-label={`Go to slide ${index + 1}`}
                        onMouseEnter={() => setAutoPlay(false)}
                        onMouseLeave={() => setAutoPlay(true)}
                    />
                ))}
            </div>
        </section>
    )
}