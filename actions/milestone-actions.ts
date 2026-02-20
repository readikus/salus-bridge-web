import { MilestoneAction, MilestoneGuidanceContent } from "@/types/database";

/**
 * Fetch milestone actions for a sickness case.
 * Auto-creates PENDING actions if none exist yet.
 */
export async function fetchMilestoneActions(caseId: string): Promise<{ actions: MilestoneAction[] }> {
  const res = await fetch(`/api/sickness-cases/${caseId}/milestone-actions`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch milestone actions");
  }
  return res.json();
}

/**
 * Update a milestone action's status, notes, or completion date.
 */
export async function fetchUpdateMilestoneAction(
  actionId: string,
  data: { status: "PENDING" | "IN_PROGRESS" | "COMPLETED"; notes?: string; completedAt?: string },
): Promise<{ action: MilestoneAction }> {
  const res = await fetch(`/api/milestone-actions/${actionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const responseData = await res.json().catch(() => ({}));
    throw new Error(responseData.error || "Failed to update milestone action");
  }
  return res.json();
}

/**
 * Fetch milestone guidance map for a sickness case.
 * Returns guidance content keyed by milestone key.
 */
export async function fetchMilestoneGuidance(
  caseId: string,
): Promise<{ guidance: Record<string, MilestoneGuidanceContent> }> {
  const res = await fetch(`/api/sickness-cases/${caseId}/milestone-guidance`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch milestone guidance");
  }
  return res.json();
}
