import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, MapPin } from 'lucide-react'

// Placeholder for church staff data
const churchStaff = [
    {
        id: 1,
        name: "Pastor John Smith",
        role: "Senior Pastor",
        image: "https://images.pexels.com/photos/3777943/pexels-photo-3777943.jpeg",
        bio: "Leading our church since 2010 with wisdom and compassion."
    },
    {
        id: 2,
        name: "Sarah Johnson",
        role: "Worship Director",
        image: "https://images.pexels.com/photos/774095/pexels-photo-774095.jpeg",
        bio: "Guiding our worship experience with talent and devotion."
    },
    {
        id: 3,
        name: "Michael Williams",
        role: "Youth Pastor",
        image: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg",
        bio: "Mentoring the next generation with energy and insight."
    },
    {
        id: 4,
        name: "Rachel Thompson",
        role: "Children's Ministry",
        image: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg",
        bio: "Creating a fun and nurturing environment for our children."
    }
]

// Placeholder for church branches
const branches = [
    {
        id: 1,
        name: "Main Campus",
        address: "123 Faith Street, Grace City, GC 12345",
        services: "Sunday 9:00 AM & 11:00 AM",
        image: "https://images.pexels.com/photos/2693529/pexels-photo-2693529.jpeg"
    },
    {
        id: 2,
        name: "Downtown Branch",
        address: "456 Hope Avenue, Grace City, GC 12345",
        services: "Sunday 10:30 AM",
        image: "https://images.pexels.com/photos/531321/pexels-photo-531321.jpeg"
    },
    {
        id: 3,
        name: "Westside Campus",
        address: "789 Love Boulevard, Grace City, GC 12345",
        services: "Sunday 9:30 AM & 5:00 PM",
        image: "https://images.pexels.com/photos/161060/church-dom-monument-italy-161060.jpeg"
    }
]

export default function AboutPage() {
    return (
        <>
            {/* Hero Section */}
            <section className="relative h-[400px] md:h-[500px] overflow-hidden">
                <Image
                    src="https://images.pexels.com/photos/175130/pexels-photo-175130.jpeg"
                    alt="About Us"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="container-custom relative z-10 h-full flex flex-col justify-center items-center text-center text-white">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 font-heading">
                        About Our Church
                    </h1>
                    <p className="text-xl max-w-2xl">
                        A community of believers committed to loving God and serving others
                    </p>
                </div>
            </section>

            {/* Vision & Mission */}
            <section className="py-16">
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div>
                            <h2 className="section-title">Our Vision</h2>
                            <p className="text-lg text-gray-700 mb-6">
                                To be a thriving, Christ-centered community where people of all backgrounds can discover
                                purpose, find belonging, and make a difference in the world.
                            </p>
                            <div className="bg-church-primary/5 p-6 rounded-lg border-l-4 border-church-primary">
                                <p className="italic text-gray-700">
                                    "Where there is no vision, the people perish: but he that keepeth the law, happy is he."
                                </p>
                                <p className="text-right text-gray-500 mt-2">- Proverbs 29:18</p>
                            </div>
                        </div>

                        <div>
                            <h2 className="section-title">Our Mission</h2>
                            <p className="text-lg text-gray-700 mb-6">
                                We exist to love God, love people, and make disciples who transform communities with the
                                message and love of Jesus Christ.
                            </p>
                            <ul className="space-y-3">
                                {[
                                    "Worship God authentically and passionately",
                                    "Grow in biblical knowledge and spiritual maturity",
                                    "Serve one another and our community with love",
                                    "Share the good news of Jesus locally and globally"
                                ].map((item, index) => (
                                    <li key={index} className="flex items-start">
                                        <Check className="h-5 w-5 text-church-primary mr-2 mt-1 flex-shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Statement of Faith */}
            <section className="py-16 bg-gray-50">
                <div className="container-custom">
                    <h2 className="section-title centered">Statement of Faith</h2>
                    <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-church-primary mb-2">The Bible</h3>
                                <p>We believe the Bible is the inspired, infallible Word of God, the supreme and final authority for all matters of faith and conduct.</p>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-church-primary mb-2">God</h3>
                                <p>We believe in one God, eternally existing in three persons: Father, Son, and Holy Spirit.</p>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-church-primary mb-2">Jesus Christ</h3>
                                <p>We believe in the deity of our Lord Jesus Christ, His virgin birth, His sinless life, His miracles, His atoning death, His bodily resurrection, His ascension to the right hand of the Father, and His personal return in power and glory.</p>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-church-primary mb-2">Salvation</h3>
                                <p>We believe that salvation is by grace through faith in Jesus Christ alone. Good works are the fruit of faith, not requirements for salvation.</p>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-church-primary mb-2">The Church</h3>
                                <p>We believe in the spiritual unity of believers in our Lord Jesus Christ, with equality across racial, gender, and class differences.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="py-16">
                <div className="container-custom">
                    <h2 className="section-title centered">Our Core Values</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
                        {[
                            {
                                title: "Biblical Truth",
                                description: "We are committed to teaching and living according to God's Word.",
                                icon: "📖"
                            },
                            {
                                title: "Authentic Worship",
                                description: "We worship God with our whole hearts in spirit and truth.",
                                icon: "🙌"
                            },
                            {
                                title: "Loving Community",
                                description: "We foster genuine relationships where everyone belongs.",
                                icon: "❤️"
                            },
                            {
                                title: "Missional Living",
                                description: "We serve others and share Christ's love in our daily lives.",
                                icon: "🌎"
                            },
                            {
                                title: "Grace-Filled Culture",
                                description: "We extend grace and forgiveness as we've received from Christ.",
                                icon: "✝️"
                            },
                            {
                                title: "Spiritual Growth",
                                description: "We encourage continuous growth in faith and character.",
                                icon: "🌱"
                            },
                            {
                                title: "Generosity",
                                description: "We give freely of our time, talents, and resources.",
                                icon: "🎁"
                            },
                            {
                                title: "Excellence",
                                description: "We pursue excellence in all we do, honoring God with our best.",
                                icon: "⭐"
                            }
                        ].map((value, index) => (
                            <Card key={index} className="card-hover text-center">
                                <CardContent className="pt-6">
                                    <div className="text-4xl mb-4">{value.icon}</div>
                                    <h3 className="text-xl font-bold mb-2 font-heading text-church-primary">{value.title}</h3>
                                    <p className="text-gray-600">{value.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Staff Section */}
            <section className="py-16 bg-gray-50">
                <div className="container-custom">
                    <h2 className="section-title centered">Our Leadership Team</h2>
                    <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
                        Meet the dedicated leaders who serve our church community with passion and dedication.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {churchStaff.map((staff) => (
                            <div key={staff.id} className="group text-center">
                                <div className="relative h-64 mb-4 overflow-hidden rounded-lg card-hover">
                                    <Image
                                        src={staff.image}
                                        alt={staff.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-church-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">{staff.name}</h3>
                                <p className="text-church-primary font-medium mb-2">{staff.role}</p>
                                <p className="text-gray-600">{staff.bio}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Branch Locator */}
            <section className="py-16">
                <div className="container-custom">
                    <h2 className="section-title centered">Our Locations</h2>
                    <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
                        With multiple locations across the city, there's always a Grace Church campus near you.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {branches.map((branch) => (
                            <div key={branch.id} className="card-hover">
                                <div className="relative h-48 overflow-hidden rounded-t-lg">
                                    <Image
                                        src={branch.image}
                                        alt={branch.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-cover"
                                    />
                                </div>
                                <div className="p-6 border border-t-0 border-gray-200 rounded-b-lg">
                                    <h3 className="text-xl font-bold mb-2">{branch.name}</h3>
                                    <div className="flex items-start mb-2">
                                        <MapPin className="h-5 w-5 text-church-primary flex-shrink-0 mt-0.5 mr-2" />
                                        <p className="text-gray-600">{branch.address}</p>
                                    </div>
                                    <p className="text-gray-600 mb-4">
                                        <span className="font-medium">Service Times:</span> {branch.services}
                                    </p>
                                    <Button asChild variant="outline" size="sm" className="w-full">
                                        <Link href="/contact">Get Directions</Link>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    )
}