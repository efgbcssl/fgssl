import Link from 'next/link'
import { Facebook, Twitter, Instagram, Youtube, MapPin, Phone, Mail, Clock, Church } from 'lucide-react'

const navigation = {
    main: [
        { name: 'Home', href: '/' },
        { name: 'About Us', href: '/about' },
        { name: 'Blog', href: '/blog' },
        { name: 'Donation', href: '/donation' },
        { name: 'Resources', href: '/resources' },
        { name: 'Contact', href: '/contact' },
    ],
    social: [
        { name: 'Facebook', icon: Facebook, href: '#' },
        { name: 'Twitter', icon: Twitter, href: '#' },
        { name: 'Instagram', icon: Instagram, href: '#' },
        { name: 'Youtube', icon: Youtube, href: '#' },
    ],
}

const Footer = () => {
    return (
        <footer className="bg-church-primary text-white">
            <div className="container-custom py-12">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {/* Church Info */}
                    <div>
                        <Link href="/" className="flex items-center space-x-2 mb-6">
                            <Church size={32} className="text-white" />
                            <span className="font-heading text-xl font-bold text-white">Grace Church</span>
                        </Link>
                        <p className="text-gray-300 mb-6">
                            Transforming lives through faith, hope, and love. Join our community and be part of something greater.
                        </p>
                        <div className="flex space-x-4">
                            {navigation.social.map((item) => (
                                <Link key={item.name} href={item.href} className="text-gray-300 hover:text-church-secondary">
                                    <span className="sr-only">{item.name}</span>
                                    <item.icon className="h-6 w-6" aria-hidden="true" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 font-heading">Quick Links</h3>
                        <ul className="space-y-3">
                            {navigation.main.map((item) => (
                                <li key={item.name}>
                                    <Link href={item.href} className="text-gray-300 hover:text-church-secondary transition-colors">
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 font-heading">Contact Information</h3>
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <MapPin className="h-5 w-5 text-church-secondary flex-shrink-0 mt-0.5" />
                                <span className="text-gray-300">123 Faith Street, Grace City, GC 12345</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Phone className="h-5 w-5 text-church-secondary flex-shrink-0" />
                                <span className="text-gray-300">(123) 456-7890</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Mail className="h-5 w-5 text-church-secondary flex-shrink-0" />
                                <span className="text-gray-300">info@gracechurch.org</span>
                            </div>
                            <div className="flex items-start space-x-3">
                                <Clock className="h-5 w-5 text-church-secondary flex-shrink-0 mt-0.5" />
                                <div className="text-gray-300">
                                    <p>Sunday Service: 9:00 AM & 11:00 AM</p>
                                    <p>Weekday Office: 9:00 AM - 5:00 PM</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 font-heading">Subscribe to Our Newsletter</h3>
                        <p className="text-gray-300 mb-4">Stay updated with our latest sermons and events.</p>
                        <form className="space-y-3">
                            <input
                                type="email"
                                placeholder="Your email address"
                                className="w-full px-4 py-2 rounded-md text-gray-900 focus:ring-2 focus:ring-church-secondary focus:outline-none"
                                required
                            />
                            <button
                                type="submit"
                                className="w-full bg-church-secondary text-church-dark px-4 py-2 rounded-md hover:bg-church-secondary/90 transition-colors"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                <hr className="my-8 border-gray-700" />

                <div className="flex flex-col md:flex-row justify-between items-center">
                    <p className="text-gray-300 text-sm">
                        &copy; {new Date().getFullYear()} Grace Community Church. All rights reserved.
                    </p>
                    <div className="flex space-x-6 mt-4 md:mt-0 text-sm">
                        <Link href="/privacy-policy" className="text-gray-300 hover:text-church-secondary">
                            Privacy Policy
                        </Link>
                        <Link href="/terms-of-service" className="text-gray-300 hover:text-church-secondary">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer