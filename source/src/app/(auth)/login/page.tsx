"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { useState } from "react"

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget as HTMLFormElement)

        const res = await signIn("credentials", {
            redirect: false,
            email: formData.get("email"),
            password: formData.get("password"),
            callbackUrl,
        })

        if (res?.ok) {
            router.push(res.url || callbackUrl)
        } else {
            setError("Invalid email or password.")
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded shadow-md w-96">
                <h1 className="text-2xl font-bold mb-6">Login</h1>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1">Email</label>
                        <input
                            name="email"
                            type="email"
                            defaultValue="test@example.com"
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1">Password</label>
                        <input
                            name="password"
                            type="password"
                            defaultValue="password"
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                    >
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    )
}
