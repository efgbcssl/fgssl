"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"
import Link from "next/link"

export function ErrorComponent({
    title,
    message,
    retryLink
}: {
    title: string
    message: string
    retryLink: string
}) {
    return (
        <div className="container-custom py-16">
            <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md border border-red-100">
                <div className="flex flex-col items-center text-center space-y-4">
                    <AlertTriangle className="h-12 w-12 text-red-500" />
                    <h2 className="text-2xl font-bold text-red-600">{title}</h2>
                    <p className="text-gray-600">{message}</p>
                    <Button asChild variant="outline" className="mt-4">
                        <Link href={retryLink} className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Try Again
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}