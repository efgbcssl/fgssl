// src/auth.ts
/*
import { createAuth } from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { auth, handlers: { GET, POST } } = createAuth({/*
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (
                    credentials?.email === "test@example.com" &&
                    credentials?.password === "password"
                ) {
                    return { id: "1", name: "Test User", email: "test@example.com", role: "admin" }
                }
                return null
            },
        }),
    ],
    secret: process.env.AUTH_SECRET,
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
})
*/