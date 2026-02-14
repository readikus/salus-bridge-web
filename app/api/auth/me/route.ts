import { NextResponse } from "next/server";
import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { AuthService } from "@/providers/services/auth.service";
import { getAllPermissions } from "@/constants/permissions";

const auth0 = new Auth0Client();

/**
 * GET /api/auth/me
 * Returns the current user's session data including roles and permissions.
 * Used by the useAuth hook to hydrate client-side auth state.
 */
export async function GET() {
  try {
    const session = await auth0.getSession();

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get or create the local user with roles
    let sessionUser = await AuthService.getSessionUser(session.user.sub);

    if (!sessionUser) {
      // First login — create local user
      sessionUser = await AuthService.handleLoginCallback({
        sub: session.user.sub,
        email: session.user.email!,
        given_name: session.user.given_name,
        family_name: session.user.family_name,
      });
    }

    const permissions = getAllPermissions(sessionUser.roles);

    return NextResponse.json({
      user: sessionUser,
      permissions,
    });
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
