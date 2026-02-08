import { auth } from "@/app/auth";
import { NextRequest, NextResponse } from "next/server";
import { checkUserAccess } from "@/app/lib/google-sheets";

export async function proxy(request: NextRequest) {
  const session = await auth();
  const pathname = request.nextUrl.pathname;

  // Allow access to login, auth routes, unauthorized page, and access-request API without authentication
  if (
    pathname.startsWith("/login") || 
    pathname.startsWith("/api/auth") || 
    pathname === "/" || 
    pathname === "/unauthorized" ||
    pathname.startsWith("/api/access-request")
  ) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check if user has access via registry
  try {
    const access = await checkUserAccess(session.user.email);
    
    if (!access.hasAccess) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // User has access, continue
    return NextResponse.next();
  } catch (error) {
    console.error("Error checking user access:", error);
    // On error, redirect to unauthorized page for safety
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }
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
