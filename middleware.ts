import { auth } from "@/app/auth";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await auth();
  const allowedEmails = (process.env.ALLOWED_EMAILS || "").split(",").map(email => email.trim());

  const pathname = request.nextUrl.pathname;

  // Allow access to login, auth routes, and unauthorized page without authentication
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth") || pathname === "/" || pathname === "/unauthorized") {
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check if user's email is in the allowlist
  if (!allowedEmails.includes(session.user.email)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
