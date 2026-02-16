import { OhReferralWithDetails, OhReferralCommunicationWithAuthor } from "@/types/database";
import { CreateOhReferralInput, UpdateReferralStatusInput, AddCommunicationInput } from "@/schemas/oh-referral";

export interface OhReferralFilters {
  status?: string;
  employeeId?: string;
  providerId?: string;
}

/**
 * Fetch all referrals for an organisation with optional filters.
 */
export async function fetchOhReferrals(slug: string, filters?: OhReferralFilters): Promise<OhReferralWithDetails[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.employeeId) params.set("employeeId", filters.employeeId);
  if (filters?.providerId) params.set("providerId", filters.providerId);

  const queryString = params.toString();
  const url = `/api/organisations/${slug}/oh-referrals${queryString ? `?${queryString}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch referrals");
  }

  const data = await res.json();
  return data.referrals;
}

/**
 * Fetch a single referral with details and communications.
 */
export async function fetchOhReferral(
  slug: string,
  id: string,
): Promise<{ referral: OhReferralWithDetails; communications: OhReferralCommunicationWithAuthor[] }> {
  const res = await fetch(`/api/organisations/${slug}/oh-referrals/${id}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch referral");
  }

  return res.json();
}

/**
 * Create a new OH referral.
 */
export async function createOhReferral(slug: string, data: CreateOhReferralInput): Promise<OhReferralWithDetails> {
  const res = await fetch(`/api/organisations/${slug}/oh-referrals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const responseData = await res.json().catch(() => ({}));
    throw new Error(responseData.error || "Failed to create referral");
  }

  const responseData = await res.json();
  return responseData.referral;
}

/**
 * Update referral status.
 */
export async function updateReferralStatus(
  slug: string,
  id: string,
  data: UpdateReferralStatusInput,
): Promise<OhReferralWithDetails> {
  const res = await fetch(`/api/organisations/${slug}/oh-referrals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const responseData = await res.json().catch(() => ({}));
    throw new Error(responseData.error || "Failed to update referral status");
  }

  const responseData = await res.json();
  return responseData.referral;
}

/**
 * Fetch communications for a referral.
 */
export async function fetchReferralCommunications(
  slug: string,
  id: string,
): Promise<OhReferralCommunicationWithAuthor[]> {
  const res = await fetch(`/api/organisations/${slug}/oh-referrals/${id}/communications`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch communications");
  }

  const data = await res.json();
  return data.communications;
}

/**
 * Add a communication to a referral.
 */
export async function addReferralCommunication(
  slug: string,
  id: string,
  data: AddCommunicationInput,
): Promise<OhReferralCommunicationWithAuthor> {
  const res = await fetch(`/api/organisations/${slug}/oh-referrals/${id}/communications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const responseData = await res.json().catch(() => ({}));
    throw new Error(responseData.error || "Failed to add communication");
  }

  const responseData = await res.json();
  return responseData.communication;
}
