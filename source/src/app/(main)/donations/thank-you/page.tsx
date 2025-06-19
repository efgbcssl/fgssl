import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ThankYouPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
            <div className="max-w-md space-y-6">
                <div className="text-green-500 text-6xl mb-4">✓</div>
                <h1 className="text-3xl font-bold">Thank You for Your Donation!</h1>
                <p className="text-gray-600">
                    Your generous contribution helps support our ministry and community outreach programs.
                    A receipt has been sent to your email.
                </p>
                <div className="pt-4">
                    <Button asChild>
                        <Link href="/">
                            Return to Home
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}