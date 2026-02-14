"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { hasPermission } from "@/constants/permissions";
import { SessionUser, UserRoleWithOrg } from "@/types/auth";

interface UseAuthReturn {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  roles: UserRoleWithOrg[];
  currentOrganisationId: string | null;
  can: (permission: string) => boolean;
}

/**
 * Custom auth hook wrapping Auth0's useUser() with extended role/permission data.
 * Fetches the full SessionUser (roles, permissions) from /api/auth/me on mount.
 */
export function useAuth(): UseAuthReturn {
  const { user: auth0User, isLoading: isAuth0Loading } = useUser();
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isLoadingMe, setIsLoadingMe] = useState(false);

  useEffect(() => {
    if (!auth0User) {
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
  }, [auth0User]);

  const roles = useMemo(() => sessionUser?.roles || [], [sessionUser]);
  const currentOrganisationId = useMemo(
    () => sessionUser?.currentOrganisationId || null,
    [sessionUser],
  );

  /**
   * Memoized permission check.
   * Returns true if the current user has the specified permission.
   */
  const can = useCallback(
    (permission: string): boolean => {
      if (!sessionUser) return false;
      if (sessionUser.isSuperAdmin) return true;
      return hasPermission(roles, permission, currentOrganisationId || undefined);
    },
    [sessionUser, roles, currentOrganisationId],
  );

  return {
    user: sessionUser,
    isLoading: isAuth0Loading || isLoadingMe,
    isAuthenticated: !!auth0User && !!sessionUser,
    roles,
    currentOrganisationId,
    can,
  };
}
