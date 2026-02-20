import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { getAllPermissions } from "@/constants/permissions";

/**
 * GET /api/auth/me
 * Returns the current user's session data including roles and permissions.
 * Used by the useAuth hook to hydrate client-side auth state.
 */
export async function GET() {
  try {
    const sessionUser = await getAuthenticatedUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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
