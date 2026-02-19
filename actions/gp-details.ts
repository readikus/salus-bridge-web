import { GpDetailsInput, MedicalConsentInput } from "@/schemas/gp-details";
import { MedicalRecordsConsent, MedicalRecordsConsentWithEmployee } from "@/types/database";

/**
 * Fetch GP details for an employee.
 */
export async function fetchGpDetails(
  employeeId: string,
): Promise<{ gpName: string | null; gpAddress: string | null; gpPhone: string | null } | null> {
  const res = await fetch(`/api/employees/${employeeId}/gp-details`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch GP details");
  }

  const data = await res.json();
  return data.gpDetails;
}

/**
 * Update GP details for an employee.
 */
export async function updateGpDetails(employeeId: string, details: GpDetailsInput): Promise<{ success: boolean }> {
  const res = await fetch(`/api/employees/${employeeId}/gp-details`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(details),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to update GP details");
  }

  return res.json();
}

/**
 * Fetch the consent record for an employee.
 */
export async function fetchConsent(employeeId: string): Promise<MedicalRecordsConsent | null> {
  const res = await fetch(`/api/employees/${employeeId}/consent`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch consent");
  }

  const data = await res.json();
  return data.consent;
}

/**
 * Submit a consent action (grant or revoke).
 */
export async function submitConsent(
  employeeId: string,
  data: MedicalConsentInput,
): Promise<MedicalRecordsConsent> {
  const res = await fetch(`/api/employees/${employeeId}/consent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const responseData = await res.json().catch(() => ({}));
    throw new Error(responseData.error || "Failed to submit consent");
  }

  const responseData = await res.json();
  return responseData.consent;
}

/**
 * Fetch all employee consent statuses for an organisation.
 */
export async function fetchOrgConsents(slug: string): Promise<MedicalRecordsConsentWithEmployee[]> {
  const res = await fetch(`/api/organisations/${slug}/consent`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch organisation consents");
  }

  const data = await res.json();
  return data.consents;
}
