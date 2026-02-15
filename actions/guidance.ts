import { GuidanceScript } from "@/constants/guidance-content";

export interface GuidanceResponse {
  script: GuidanceScript | null;
  engagedSteps: string[];
}

/**
 * Fetch guidance for a sickness case.
 * Returns the appropriate script and already-engaged steps.
 */
export async function fetchGuidance(caseId: string): Promise<GuidanceResponse> {
  const res = await fetch(`/api/guidance/${caseId}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch guidance");
  }

  return res.json();
}

/**
 * Track engagement with a guidance step.
 */
export async function fetchTrackEngagement(
  caseId: string,
  guidanceType: string,
  guidanceStep: string,
): Promise<void> {
  const res = await fetch(`/api/guidance/${caseId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guidanceType, guidanceStep }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to track engagement");
  }
}
