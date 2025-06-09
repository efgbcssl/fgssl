import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="text-center py-16">
            <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
            <p className="text-xl mb-6">
                The page you are looking for doesn&apos;t exist or has been moved.
            </p>
            <Link
                href="/"
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition inline-block"
            >
                Go back home
            </Link>
        </div>
    )
}