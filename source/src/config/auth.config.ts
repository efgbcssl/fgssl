/*import Credentials from "next-auth/providers/credentials"

export const authConfig = {/*
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const { email, password } = credentials as {
                    email: string
                    password: string
                }

                // Dummy check
                if (email === "admin@example.com" && password === "admin123") {
                    return {
                        id: "1",
                        name: "Admin User",
                        email: "admin@example.com",
                        role: "admin"
                    }
                }

                return null
            }
        })
    ],
    pages: {
        signIn: "/login"
    },
    secret: process.env.AUTH_SECRET,
    debug: true // 👈 Add this line
} satisfies NextAuthConfig
*/