import { BradfordFactorResult } from "@/providers/services/bradford-factor.service";

export interface OrgBradfordFactorEntry {
  employeeId: string;
  firstName: string | null;
  lastName: string | null;
  departmentName: string | null;
  score: number;
  spells: number;
  totalDays: number;
  riskLevel: string;
}

/**
 * Fetch Bradford Factor scores for all employees in an organisation.
 */
export async function fetchOrgBradfordFactors(
  slug: string,
  departmentId?: string,
): Promise<{ employees: OrgBradfordFactorEntry[] }> {
  const params = new URLSearchParams();
  if (departmentId) params.set("departmentId", departmentId);

  const queryString = params.toString();
  const url = `/api/organisations/${slug}/bradford-factor${queryString ? `?${queryString}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch Bradford Factor scores");
  }
  return res.json();
}

/**
 * Fetch Bradford Factor for a single employee.
 */
export async function fetchEmployeeBradfordFactor(
  employeeId: string,
): Promise<{ bradfordFactor: BradfordFactorResult }> {
  const res = await fetch(`/api/employees/${employeeId}/bradford-factor`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch employee Bradford Factor");
  }
  return res.json();
}
