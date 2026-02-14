"use client";

import { useTenantStore } from "@/app/stores/tenant-store";

/**
 * Hook for tenant context management.
 * Used by platform admins to switch between organisations.
 */
export function useTenant() {
  const currentOrganisationId = useTenantStore((s) => s.currentOrganisationId);
  const currentOrganisationName = useTenantStore((s) => s.currentOrganisationName);
  const setOrganisation = useTenantStore((s) => s.setOrganisation);

  return {
    currentOrganisationId,
    currentOrganisationName,
    setOrganisation,
  };
}
