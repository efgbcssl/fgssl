// src/middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const PUBLIC_PATHS = [
    "/auth/login",
    "/auth/register",
    "/_next",
    "/favicon.ico",
    "/api"
]

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
        return NextResponse.next()
    }

    const token = await getToken({ req, secret: process.env.AUTH_SECRET })

    if (!token) {
        return NextResponse.redirect(new URL("/auth/login", req.url))
    }

    // Optionally: Add custom logic based on token content, e.g., roles
    return NextResponse.next()
}

export const config = {
    matcher: ["/resourcesssss/:path*"]
}
