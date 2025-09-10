import { auth } from "@/auth"
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // 1. Define public routes (no auth needed)
  const publicRoutes = [
    "/",
    "/about",
    "/contact",
    "/login", // Changed from "/auth/login"
    "/unauthorized" // Changed from "/auth/unauthorized"
  ];

  // 2. Define protected routes (auth required)
  const protectedRoutes = [
    "/dashboard",
    "/dashboard/(.*)" // All subroutes under dashboard
  ];

  // 3. Always allow NextAuth API routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // 4. Check if current route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );

  // 5. Check if current route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // 6. Handle public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // 7. Handle protected routes
  if (isProtectedRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based access control
    const userRole = req.auth?.user?.role || 'member';
    
    // Admin-only routes
    if (pathname.startsWith("/dashboard/admin") && userRole !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    
    // Manager and Admin routes
    if (pathname.startsWith("/dashboard/manager") && !['admin', 'manager'].includes(userRole)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    
    // Permissions management - Admin only
    if (pathname.startsWith("/dashboard/permissions") && userRole !== "admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  // 8. Default allow other routes (or redirect if you prefer)
  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api/ routes (except auth routes which we handle above)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
export const runtime = "nodejs";
