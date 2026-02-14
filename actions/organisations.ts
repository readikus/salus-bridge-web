import { Organisation } from "@/types/database";
import { OrgDashboardStats } from "@/providers/services/organisation.service";
import { CreateOrganisationInput, UpdateOrganisationInput, OrgSettings } from "@/schemas/organisation";

/**
 * Fetch all organisations (platform admin list).
 */
export async function fetchOrganisations(): Promise<Organisation[]> {
  const res = await fetch("/api/organisations");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch organisations");
  }
  const data = await res.json();
  return data.organisations;
}

/**
 * Fetch a single organisation by slug.
 */
export async function fetchOrganisation(slug: string): Promise<Organisation> {
  const res = await fetch(`/api/organisations/${slug}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch organisation");
  }
  const data = await res.json();
  return data.organisation;
}

/**
 * Create a new organisation.
 */
export async function fetchCreateOrganisation(data: CreateOrganisationInput): Promise<Organisation> {
  const res = await fetch("/api/organisations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create organisation");
  }
  const result = await res.json();
  return result.organisation;
}

/**
 * Update an existing organisation.
 */
export async function fetchUpdateOrganisation(
  slug: string,
  data: UpdateOrganisationInput,
): Promise<Organisation> {
  const res = await fetch(`/api/organisations/${slug}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update organisation");
  }
  const result = await res.json();
  return result.organisation;
}

/**
 * Assign an admin to an organisation.
 */
export async function fetchAssignAdmin(slug: string, email: string): Promise<void> {
  const res = await fetch(`/api/organisations/${slug}/admins`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to assign admin");
  }
}

/**
 * Remove an admin from an organisation.
 */
export async function fetchRemoveAdmin(slug: string, userId: string): Promise<void> {
  const res = await fetch(`/api/organisations/${slug}/admins`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to remove admin");
  }
}

/**
 * Fetch organisation dashboard stats.
 */
export async function fetchOrgDashboard(slug: string): Promise<OrgDashboardStats> {
  const res = await fetch(`/api/organisations/${slug}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch organisation dashboard");
  }
  const data = await res.json();
  return data.organisation;
}

/**
 * Fetch organisation settings.
 */
export async function fetchOrgSettings(slug: string): Promise<OrgSettings> {
  const res = await fetch(`/api/organisations/${slug}/settings`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch settings");
  }
  const data = await res.json();
  return data.settings;
}

/**
 * Update organisation settings.
 */
export async function fetchUpdateOrgSettings(slug: string, settings: OrgSettings): Promise<OrgSettings> {
  const res = await fetch(`/api/organisations/${slug}/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update settings");
  }
  const data = await res.json();
  return data.settings;
}

/**
 * Fetch admins for an organisation.
 */
export async function fetchOrgAdmins(slug: string): Promise<any[]> {
  const res = await fetch(`/api/organisations/${slug}/admins`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch admins");
  }
  const data = await res.json();
  return data.admins;
}
