"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createBrowserClient } from "@/providers/supabase/browser-client";
import { hasPermission } from "@/constants/permissions";
import { SessionUser, UserRoleWithOrg } from "@/types/auth";

interface UseAuthReturn {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  roles: UserRoleWithOrg[];
  currentOrganisationId: string | null;
  can: (permission: string) => boolean;
  signOut: () => Promise<void>;
}

/**
 * Custom auth hook using Supabase auth state with extended role/permission data.
 * Fetches the full SessionUser (roles, permissions) from /api/auth/me on mount.
 */
export function useAuth(): UseAuthReturn {
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSupabaseUser, setIsSupabaseUser] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isLoadingMe, setIsLoadingMe] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient();

    // Check initial auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsSupabaseUser(!!user);
      setIsAuthLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSupabaseUser(!!session?.user);
      setIsAuthLoading(false);
      if (!session?.user) {
        setSessionUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseUser) {
      setSessionUser(null);
      return;
    }

    let cancelled = false;
    setIsLoadingMe(true);

    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load user data");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setSessionUser(data.user);
        }
      })
      .catch((err) => {
        console.error("Failed to load auth data:", err);
        if (!cancelled) {
          setSessionUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingMe(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isSupabaseUser]);

  const roles = useMemo(() => sessionUser?.roles || [], [sessionUser]);
  const currentOrganisationId = useMemo(() => sessionUser?.currentOrganisationId || null, [sessionUser]);

  const can = useCallback(
    (permission: string): boolean => {
      if (!sessionUser) return false;
      if (sessionUser.isSuperAdmin) return true;
      return hasPermission(roles, permission, currentOrganisationId || undefined);
    },
    [sessionUser, roles, currentOrganisationId],
  );

  const signOut = useCallback(async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }, []);

  return {
    user: sessionUser,
    isLoading: isAuthLoading || isLoadingMe,
    isAuthenticated: isSupabaseUser && !!sessionUser,
    roles,
    currentOrganisationId,
    can,
    signOut,
  };
}
