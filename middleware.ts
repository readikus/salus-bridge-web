import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Auth0Client } from "@auth0/nextjs-auth0/server";

const auth0 = new Auth0Client();

export async function middleware(request: NextRequest) {
  // Let Auth0 SDK handle auth routes (/auth/login, /auth/logout, /auth/callback, /auth/profile)
  const authResponse = await auth0.middleware(request);

  // For Auth0 routes, return the Auth0 response directly
  if (request.nextUrl.pathname.startsWith("/auth/")) {
    return authResponse;
  }

  // Public routes — pass through without auth check
  const isPublicPath =
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/invite/") ||
    request.nextUrl.pathname === "/invite" ||
    request.nextUrl.pathname.startsWith("/api/auth/");

  if (isPublicPath) {
    return authResponse;
  }

  // For all other routes (authenticated area), check for session
  const session = await auth0.getSession(request);

  if (!session) {
    // Redirect to Auth0 login
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("returnTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Attach user info to headers for server components
  const response = authResponse;
  if (session.user) {
    response.headers.set("x-user-sub", session.user.sub);
    if (session.user.email) {
      response.headers.set("x-user-email", session.user.email);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
