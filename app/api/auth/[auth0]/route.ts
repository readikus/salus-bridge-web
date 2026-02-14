/**
 * Auth0 catch-all route handler.
 *
 * In Auth0 SDK v4, the auth routes (login, logout, callback, profile)
 * are handled by the Auth0 middleware. This catch-all route exists to
 * ensure Next.js routes requests to /api/auth/* correctly so the
 * middleware can process them.
 *
 * The middleware in middleware.ts returns the auth0.middleware() response
 * for all /api/auth/* paths.
 */
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // This should not be reached — the middleware intercepts /api/auth/* requests
  return NextResponse.json({ error: "Auth route not found" }, { status: 404 });
}
