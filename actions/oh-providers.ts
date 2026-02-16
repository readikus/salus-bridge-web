import { OhProvider } from "@/types/database";
import { OhProviderInput } from "@/schemas/oh-provider";

/**
 * Fetch all OH providers for an organisation.
 */
export async function fetchOhProviders(slug: string): Promise<OhProvider[]> {
  const res = await fetch(`/api/organisations/${slug}/oh-providers`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch OH providers");
  }

  const data = await res.json();
  return data.providers;
}

/**
 * Create a new OH provider.
 */
export async function createOhProvider(slug: string, data: OhProviderInput): Promise<OhProvider> {
  const res = await fetch(`/api/organisations/${slug}/oh-providers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const responseData = await res.json().catch(() => ({}));
    throw new Error(responseData.error || "Failed to create OH provider");
  }

  const responseData = await res.json();
  return responseData.provider;
}

/**
 * Update an OH provider.
 */
export async function updateOhProvider(slug: string, id: string, data: Partial<OhProviderInput>): Promise<OhProvider> {
  const res = await fetch(`/api/organisations/${slug}/oh-providers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const responseData = await res.json().catch(() => ({}));
    throw new Error(responseData.error || "Failed to update OH provider");
  }

  const responseData = await res.json();
  return responseData.provider;
}

/**
 * Delete an OH provider.
 */
export async function deleteOhProvider(slug: string, id: string): Promise<void> {
  const res = await fetch(`/api/organisations/${slug}/oh-providers/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to delete OH provider");
  }
}
