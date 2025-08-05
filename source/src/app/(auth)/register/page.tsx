import Link from "next/dist/client/link";

export default function Register() {
    return (
        <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>
            <form className="space-y-4">
                <div>
                    <label htmlFor="name" className="block mb-1">Name</label>
                    <input
                        id="name"
                        type="text"
                        className="w-full px-4 py-2 border rounded"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block mb-1">Email</label>
                    <input
                        id="email"
                        type="email"
                        className="w-full px-4 py-2 border rounded"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block mb-1">Password</label>
                    <input
                        id="password"
                        type="password"
                        className="w-full px-4 py-2 border rounded"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="confirmPassword" className="block mb-1">Confirm Password</label>
                    <input
                        id="confirmPassword"
                        type="password"
                        className="w-full px-4 py-2 border rounded"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Register
                </button>
            </form>
            <div className="mt-4 text-center">
                <Link href="/login" className="text-blue-600 hover:underline">
                    Already have an account? Login
                </Link>
            </div>
        </div>
    )
}