import { createServerClient } from "@/providers/supabase/client";
import { AuthService } from "@/providers/services/auth.service";
import { SessionUser } from "@/types/auth";

/**
 * Get the authenticated Supabase user from the current session.
 * Returns { supabaseUserId, email } or null if not authenticated.
 *
 * Uses supabase.auth.getUser() (not getSession()) per Supabase best practices
 * — getUser() validates the JWT against the Supabase Auth server.
 */
export async function getSupabaseUser(): Promise<{ id: string; email: string } | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return null;

  return { id: user.id, email: user.email };
}

/**
 * Get the full session user (with roles, permissions) for the current request.
 * Combines Supabase auth check with local database user lookup.
 *
 * Returns null if not authenticated or user not found locally.
 */
export async function getAuthenticatedUser(): Promise<SessionUser | null> {
  const supabaseUser = await getSupabaseUser();
  if (!supabaseUser) return null;

  // Look up or create the local user
  let sessionUser = await AuthService.getSessionUser(supabaseUser.id);

  if (!sessionUser) {
    // First login — create local user from Supabase auth profile
    sessionUser = await AuthService.handleLoginCallback({
      id: supabaseUser.id,
      email: supabaseUser.email,
    });
  }

  return sessionUser;
}
