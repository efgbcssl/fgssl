'use client'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <div className="text-center py-16">
            <h2 className="text-3xl font-bold mb-4">Something went wrong!</h2>
            <p className="text-xl mb-6">{error.message}</p>
            <button
                onClick={() => reset()}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
                Try again
            </button>
        </div>
    )
}