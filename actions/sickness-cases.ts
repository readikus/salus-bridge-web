import { SicknessCase, CaseTransition } from "@/types/database";
import { CreateSicknessCaseInput } from "@/schemas/sickness-case";
import { SicknessAction } from "@/constants/sickness-states";

export interface SicknessCaseFilters {
  status?: string;
  employeeId?: string;
  search?: string;
}

export interface SicknessCaseDetailResponse {
  sicknessCase: SicknessCase & { notes?: string };
  transitions: CaseTransition[];
  availableActions: SicknessAction[];
  canManage: boolean;
}

/**
 * Fetch sickness cases for the current organisation with optional filters.
 */
export async function fetchSicknessCases(
  filters?: SicknessCaseFilters,
): Promise<{ cases: SicknessCase[]; total: number }> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.employeeId) params.set("employeeId", filters.employeeId);
  if (filters?.search) params.set("search", filters.search);

  const queryString = params.toString();
  const url = `/api/sickness-cases${queryString ? `?${queryString}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch sickness cases");
  }

  return res.json();
}

/**
 * Fetch a single sickness case by ID with transitions and available actions.
 */
export async function fetchSicknessCase(id: string): Promise<SicknessCaseDetailResponse> {
  const res = await fetch(`/api/sickness-cases/${id}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch sickness case");
  }

  return res.json();
}

/**
 * Create a new sickness case.
 */
export async function fetchCreateSicknessCase(data: CreateSicknessCaseInput): Promise<SicknessCase> {
  const res = await fetch("/api/sickness-cases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const responseData = await res.json().catch(() => ({}));
    throw new Error(responseData.error || "Failed to create sickness case");
  }

  const responseData = await res.json();
  return responseData.sicknessCase;
}

/**
 * Execute a state transition on a sickness case.
 */
export async function fetchTransitionCase(
  id: string,
  action: SicknessAction,
  notes?: string,
): Promise<SicknessCase> {
  const res = await fetch(`/api/sickness-cases/${id}/transition`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, notes }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to transition sickness case");
  }

  const responseData = await res.json();
  return responseData.sicknessCase;
}

/**
 * Fetch sickness cases for the absence calendar with date range filtering.
 */
export async function fetchAbsenceCalendar(
  month: number,
  year: number,
): Promise<{ cases: SicknessCase[]; total: number }> {
  const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endOfMonth = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const params = new URLSearchParams();
  params.set("startDateFrom", startOfMonth);
  params.set("startDateTo", endOfMonth);

  const url = `/api/sickness-cases?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch absence calendar data");
  }

  return res.json();
}

/**
 * Update a sickness case (e.g., set end date).
 */
export async function fetchUpdateSicknessCase(
  id: string,
  data: { absenceEndDate: string },
): Promise<SicknessCase> {
  const res = await fetch(`/api/sickness-cases/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const responseData = await res.json().catch(() => ({}));
    throw new Error(responseData.error || "Failed to update sickness case");
  }

  const responseData = await res.json();
  return responseData.sicknessCase;
}
