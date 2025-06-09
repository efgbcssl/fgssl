// src/lib/auth.ts
/*
import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {/*
    providers: [
        CredentialsProvider({
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const { email, password } = credentials ?? {}

                // Replace this with your actual logic
                if (email === "test@example.com" && password === "password") {
                    return {
                        id: "1",
                        name: "Test User",
                        email: "test@example.com",
                        role: "admin",
                    }
                }
                return null
            },
        }),
    ],
    secret: process.env.AUTH_SECRET,
    pages: {
        signIn: "/login", // Optional: your custom sign-in page
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) token.role = user.role
            return token
        },
        async session({ session, token }) {
            if (token?.role) session.user.role = token.role
            return session
        },
    },
}
*/