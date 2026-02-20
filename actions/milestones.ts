import { MilestoneConfig, MilestoneConfigWithGuidance } from "@/types/database";
import { CreateMilestoneConfigInput, UpdateMilestoneConfigInput } from "@/schemas/milestone-config";

/**
 * Fetch effective milestones for an organisation (defaults merged with overrides).
 */
export async function fetchMilestones(slug: string): Promise<{ milestones: MilestoneConfigWithGuidance[] }> {
  const res = await fetch(`/api/organisations/${slug}/milestones`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch milestones");
  }
  return res.json();
}

/**
 * Create or update an org-level milestone override.
 */
export async function createMilestoneOverride(
  slug: string,
  data: CreateMilestoneConfigInput,
): Promise<{ config: MilestoneConfig }> {
  const res = await fetch(`/api/organisations/${slug}/milestones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const responseData = await res.json().catch(() => ({}));
    throw new Error(responseData.error || "Failed to create milestone override");
  }
  return res.json();
}

/**
 * Update an existing milestone config override.
 */
export async function updateMilestoneOverride(
  slug: string,
  id: string,
  data: UpdateMilestoneConfigInput,
): Promise<{ config: MilestoneConfig }> {
  const res = await fetch(`/api/organisations/${slug}/milestones/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const responseData = await res.json().catch(() => ({}));
    throw new Error(responseData.error || "Failed to update milestone override");
  }
  return res.json();
}

/**
 * Delete an org milestone override (reset to default).
 */
export async function deleteMilestoneOverride(slug: string, id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/organisations/${slug}/milestones/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to delete milestone override");
  }
  return res.json();
}

// --- Session-scoped functions (resolve org from session) ---

/**
 * Fetch effective milestones for the session user's current organisation.
 */
export async function fetchSessionMilestones(): Promise<{ milestones: MilestoneConfigWithGuidance[] }> {
  const res = await fetch("/api/milestones");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch milestones");
  }
  return res.json();
}

/**
 * Create or update an org-level milestone override for the session user's current organisation.
 */
export async function createSessionMilestoneOverride(
  data: CreateMilestoneConfigInput,
): Promise<{ config: MilestoneConfig }> {
  const res = await fetch("/api/milestones", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const responseData = await res.json().catch(() => ({}));
    throw new Error(responseData.error || "Failed to create milestone override");
  }
  return res.json();
}

/**
 * Update an existing milestone config override for the session user's current organisation.
 */
export async function updateSessionMilestoneOverride(
  id: string,
  data: UpdateMilestoneConfigInput,
): Promise<{ config: MilestoneConfig }> {
  const res = await fetch(`/api/milestones/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const responseData = await res.json().catch(() => ({}));
    throw new Error(responseData.error || "Failed to update milestone override");
  }
  return res.json();
}

/**
 * Delete an org milestone override (reset to default) for the session user's current organisation.
 */
export async function deleteSessionMilestoneOverride(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/milestones/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to delete milestone override");
  }
  return res.json();
}
