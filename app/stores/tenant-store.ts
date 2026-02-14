import { create } from "zustand";

interface TenantState {
  currentOrganisationId: string | null;
  currentOrganisationName: string | null;
  setOrganisation: (id: string | null, name: string | null) => void;
}

/**
 * Zustand store for tenant context.
 * Used by platform admins to switch between organisations.
 */
export const useTenantStore = create<TenantState>((set) => ({
  currentOrganisationId: null,
  currentOrganisationName: null,
  setOrganisation: (id, name) =>
    set({ currentOrganisationId: id, currentOrganisationName: name }),
}));
