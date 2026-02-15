import { RtwMeeting } from "@/types/database";

/**
 * Fetch all RTW meetings for a sickness case.
 */
export async function fetchRtwMeetings(caseId: string): Promise<{ meetings: RtwMeeting[] }> {
  const res = await fetch(`/api/sickness-cases/${caseId}/rtw-meeting`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch RTW meetings");
  }

  return res.json();
}

/**
 * Schedule a new RTW meeting for a sickness case.
 */
export async function fetchScheduleRtwMeeting(caseId: string, scheduledDate: string): Promise<RtwMeeting> {
  const res = await fetch(`/api/sickness-cases/${caseId}/rtw-meeting`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scheduledDate }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to schedule RTW meeting");
  }

  const responseData = await res.json();
  return responseData.meeting;
}

/**
 * Complete an RTW meeting with questionnaire responses, outcomes, and adjustments.
 */
export async function fetchCompleteRtwMeeting(
  caseId: string,
  meetingId: string,
  data: {
    questionnaireResponses: Record<string, unknown>;
    outcomes: string;
    adjustments: Array<{ type: string; description: string; reviewDate?: string }>;
  },
): Promise<RtwMeeting> {
  const res = await fetch(`/api/sickness-cases/${caseId}/rtw-meeting`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      meetingId,
      action: "complete",
      ...data,
    }),
  });

  if (!res.ok) {
    const responseData = await res.json().catch(() => ({}));
    throw new Error(responseData.error || "Failed to complete RTW meeting");
  }

  const responseData = await res.json();
  return responseData.meeting;
}

/**
 * Cancel an RTW meeting.
 */
export async function fetchCancelRtwMeeting(caseId: string, meetingId: string): Promise<RtwMeeting> {
  const res = await fetch(`/api/sickness-cases/${caseId}/rtw-meeting`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      meetingId,
      action: "cancel",
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to cancel RTW meeting");
  }

  const responseData = await res.json();
  return responseData.meeting;
}
