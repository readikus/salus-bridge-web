import { TriggerConfig, TriggerAlertWithDetails } from "@/types/database";
import { CreateTriggerConfigInput, UpdateTriggerConfigInput } from "@/schemas/trigger-config";

/**
 * Fetch trigger configs for an organisation.
 */
export async function fetchTriggerConfigs(slug: string): Promise<{ configs: TriggerConfig[] }> {
  const res = await fetch(`/api/organisations/${slug}/triggers`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch trigger configs");
  }
  return res.json();
}

/**
 * Create a new trigger config.
 */
export async function createTriggerConfig(
  slug: string,
  data: CreateTriggerConfigInput,
): Promise<{ config: TriggerConfig }> {
  const res = await fetch(`/api/organisations/${slug}/triggers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const responseData = await res.json().catch(() => ({}));
    throw new Error(responseData.error || "Failed to create trigger config");
  }
  return res.json();
}

/**
 * Update a trigger config.
 */
export async function updateTriggerConfig(
  slug: string,
  id: string,
  data: UpdateTriggerConfigInput,
): Promise<{ config: TriggerConfig }> {
  const res = await fetch(`/api/organisations/${slug}/triggers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const responseData = await res.json().catch(() => ({}));
    throw new Error(responseData.error || "Failed to update trigger config");
  }
  return res.json();
}

/**
 * Delete a trigger config.
 */
export async function deleteTriggerConfig(slug: string, id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/organisations/${slug}/triggers/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to delete trigger config");
  }
  return res.json();
}

/**
 * Fetch trigger alerts for an organisation.
 */
export async function fetchTriggerAlerts(
  slug: string,
  filters?: { employeeId?: string; acknowledged?: boolean; limit?: number; offset?: number },
): Promise<{ alerts: TriggerAlertWithDetails[] }> {
  const params = new URLSearchParams();
  params.set("view", "alerts");
  if (filters?.employeeId) params.set("employeeId", filters.employeeId);
  if (filters?.acknowledged !== undefined) params.set("acknowledged", String(filters.acknowledged));
  if (filters?.limit) params.set("limit", String(filters.limit));
  if (filters?.offset) params.set("offset", String(filters.offset));

  const res = await fetch(`/api/organisations/${slug}/triggers?${params.toString()}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch trigger alerts");
  }
  return res.json();
}

/**
 * Acknowledge a trigger alert.
 */
export async function acknowledgeTriggerAlert(
  slug: string,
  alertId: string,
): Promise<{ alert: TriggerAlertWithDetails }> {
  const res = await fetch(`/api/organisations/${slug}/triggers/${alertId}`, {
    method: "PATCH",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to acknowledge alert");
  }
  return res.json();
}

// --- Session-scoped functions (resolve org from session) ---

/**
 * Fetch trigger configs for the session user's current organisation.
 */
export async function fetchSessionTriggerConfigs(): Promise<{ configs: TriggerConfig[] }> {
  const res = await fetch("/api/triggers");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch trigger configs");
  }
  return res.json();
}

/**
 * Create a new trigger config for the session user's current organisation.
 */
export async function createSessionTriggerConfig(data: CreateTriggerConfigInput): Promise<{ config: TriggerConfig }> {
  const res = await fetch("/api/triggers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const responseData = await res.json().catch(() => ({}));
    throw new Error(responseData.error || "Failed to create trigger config");
  }
  return res.json();
}

/**
 * Update a trigger config for the session user's current organisation.
 */
export async function updateSessionTriggerConfig(
  id: string,
  data: UpdateTriggerConfigInput,
): Promise<{ config: TriggerConfig }> {
  const res = await fetch(`/api/triggers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const responseData = await res.json().catch(() => ({}));
    throw new Error(responseData.error || "Failed to update trigger config");
  }
  return res.json();
}

/**
 * Delete a trigger config for the session user's current organisation.
 */
export async function deleteSessionTriggerConfig(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/triggers/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to delete trigger config");
  }
  return res.json();
}

/**
 * Fetch trigger alerts for the session user's current organisation.
 */
export async function fetchSessionTriggerAlerts(
  filters?: { employeeId?: string; acknowledged?: boolean; limit?: number; offset?: number },
): Promise<{ alerts: TriggerAlertWithDetails[] }> {
  const params = new URLSearchParams();
  params.set("view", "alerts");
  if (filters?.employeeId) params.set("employeeId", filters.employeeId);
  if (filters?.acknowledged !== undefined) params.set("acknowledged", String(filters.acknowledged));
  if (filters?.limit) params.set("limit", String(filters.limit));
  if (filters?.offset) params.set("offset", String(filters.offset));

  const res = await fetch(`/api/triggers?${params.toString()}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch trigger alerts");
  }
  return res.json();
}

/**
 * Acknowledge a trigger alert for the session user's current organisation.
 */
export async function acknowledgeSessionTriggerAlert(alertId: string): Promise<{ alert: TriggerAlertWithDetails }> {
  const res = await fetch(`/api/triggers/${alertId}`, {
    method: "PATCH",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to acknowledge alert");
  }
  return res.json();
}
