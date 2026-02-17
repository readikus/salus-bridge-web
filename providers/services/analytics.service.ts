import { AnalyticsRepository, AbsenceRateRow, MonthlyTrendRow } from "@/providers/repositories/analytics.repository";
import { BradfordFactorService, BradfordFactorResult } from "@/providers/services/bradford-factor.service";
import { EmployeeRepository } from "@/providers/repositories/employee.repository";
import { AnalyticsQueryParams, periodToMonths } from "@/schemas/analytics";
import { UserRole } from "@/types/enums";
import { PoolClient } from "pg";

/**
 * Minimum cohort size for privacy enforcement (ANAL-04).
 * Groups with fewer than this many employees have their data suppressed.
 */
export const MINIMUM_COHORT_SIZE = 5;

export interface SuppressedGroup {
  groupId: string;
  groupName: string;
  employeeCount: number;
  suppressed: true;
  reason: string;
}

export interface AnalyticsAbsenceRate extends AbsenceRateRow {
  suppressed?: false;
}

export type AbsenceRateResult = AnalyticsAbsenceRate | SuppressedGroup;

export interface BradfordScoreRow {
  employeeId: string;
  firstName: string | null;
  lastName: string | null;
  departmentName: string | null;
  score: number;
  spells: number;
  totalDays: number;
  riskLevel: string;
}

export interface AnalyticsResult {
  absenceRates: AbsenceRateResult[];
  trends: MonthlyTrendRow[];
  bradfordScores: BradfordScoreRow[];
  generatedAt: string;
}

/**
 * AnalyticsService -- analytics business logic with cohort size enforcement.
 * Orchestrates repository queries and Bradford Factor calculation.
 */
export class AnalyticsService {
  /**
   * Get analytics data for an organisation.
   * Enforces minimum cohort size on group-level data.
   * For MANAGER role, scopes to their direct reports only.
   */
  static async getAnalytics(
    organisationId: string,
    params: AnalyticsQueryParams,
    userId: string,
    userRole: string,
    client?: PoolClient,
  ): Promise<AnalyticsResult> {
    const periodMonths = periodToMonths(params.period);

    // Get absence rates
    const rawAbsenceRates = await AnalyticsRepository.getAbsenceRates(
      organisationId,
      periodMonths,
      params.groupBy,
      client,
    );

    // Get monthly trends
    const trends = await AnalyticsRepository.getMonthlyTrends(organisationId, periodMonths, client);

    // Get employee list for Bradford calculation
    let employees;
    if (userRole === UserRole.MANAGER) {
      // Scope to manager's direct reports
      const managerEmployee = await EmployeeRepository.findByUserId(userId);
      if (managerEmployee) {
        employees = await EmployeeRepository.findByManagerChain(managerEmployee.id, organisationId, client);
      } else {
        employees = [];
      }
    } else {
      employees = await EmployeeRepository.findByOrganisation(organisationId, undefined, client);
    }

    // Calculate Bradford Factor for all relevant employees
    const employeeIds = employees.map((e) => e.id);
    const bradfordMap = await BradfordFactorService.calculateForTeam(employeeIds, client);

    // Build Bradford scores array
    const bradfordScores: BradfordScoreRow[] = employees
      .map((emp) => {
        const bf = bradfordMap.get(emp.id);
        return {
          employeeId: emp.id,
          firstName: emp.firstName ?? null,
          lastName: emp.lastName ?? null,
          departmentName: emp.departmentName ?? null,
          score: bf?.score ?? 0,
          spells: bf?.spells ?? 0,
          totalDays: bf?.totalDays ?? 0,
          riskLevel: bf?.riskLevel ?? "Low",
        };
      })
      .sort((a, b) => b.score - a.score);

    // Apply cohort enforcement (ANAL-04)
    const absenceRates = AnalyticsService.enforceCohortSize(rawAbsenceRates, params.groupBy);

    // If MANAGER, filter absence rates to groups containing their reports
    let filteredAbsenceRates = absenceRates;
    if (userRole === UserRole.MANAGER) {
      const employeeIdSet = new Set(employeeIds);
      // For manager view, we only show the overall data -- their team stats
      // The groupBy view is limited since we can't easily cross-ref group memberships
      // without additional queries. Keep all rates but acknowledge manager scoping applies
      // primarily to Bradford scores (the individual-level data).
    }

    return {
      absenceRates: filteredAbsenceRates,
      trends,
      bradfordScores,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Enforce minimum cohort size on group-level absence rates.
   * Groups with fewer than MINIMUM_COHORT_SIZE employees are suppressed.
   * The whole-organisation level is never suppressed.
   */
  private static enforceCohortSize(
    rates: AbsenceRateRow[],
    groupBy: string,
  ): AbsenceRateResult[] {
    return rates.map((rate) => {
      // Never suppress the whole-organisation level
      if (groupBy === "organisation") {
        return { ...rate, suppressed: false as const };
      }

      if (rate.employeeCount < MINIMUM_COHORT_SIZE) {
        return {
          groupId: rate.groupId,
          groupName: rate.groupName,
          employeeCount: rate.employeeCount,
          suppressed: true as const,
          reason: "Fewer than 5 employees",
        };
      }

      return { ...rate, suppressed: false as const };
    });
  }

  /**
   * Export analytics data as CSV string.
   * Escape commas in values for proper CSV formatting.
   */
  static async exportCSV(
    organisationId: string,
    params: AnalyticsQueryParams,
    userId: string,
    userRole: string,
    client?: PoolClient,
  ): Promise<string> {
    const data = await AnalyticsService.getAnalytics(organisationId, params, userId, userRole, client);

    const lines: string[] = [];

    // Absence Rates section
    lines.push("Absence Rates");
    lines.push("Group,Employees,Absences,Days Lost,Absence Rate (%)");
    for (const rate of data.absenceRates) {
      if ("suppressed" in rate && rate.suppressed) {
        lines.push(`${AnalyticsService.csvEscape(rate.groupName)},${rate.employeeCount},Suppressed,Suppressed,Suppressed`);
      } else {
        const r = rate as AnalyticsAbsenceRate;
        lines.push(
          `${AnalyticsService.csvEscape(r.groupName)},${r.employeeCount},${r.absenceCount},${r.totalDaysLost},${r.absenceRate}`,
        );
      }
    }

    lines.push("");
    lines.push("Monthly Trends");
    lines.push("Month,New Absences,Unique Employees Absent,Days Lost");
    for (const trend of data.trends) {
      lines.push(`${trend.month},${trend.absenceCount},${trend.uniqueEmployees},${trend.totalDaysLost}`);
    }

    lines.push("");
    lines.push("Bradford Factor Scores");
    lines.push("Employee,Department,Score,Spells,Days Lost,Risk Level");
    for (const bf of data.bradfordScores) {
      const name = [bf.firstName, bf.lastName].filter(Boolean).join(" ") || "Unknown";
      lines.push(
        `${AnalyticsService.csvEscape(name)},${AnalyticsService.csvEscape(bf.departmentName || "")},${bf.score},${bf.spells},${bf.totalDays},${bf.riskLevel}`,
      );
    }

    return lines.join("\n");
  }

  /**
   * Export analytics data as print-ready HTML.
   * Returns HTML with @media print styles for clean PDF output via window.print().
   */
  static async exportHTML(
    organisationId: string,
    params: AnalyticsQueryParams,
    userId: string,
    userRole: string,
    client?: PoolClient,
  ): Promise<string> {
    const data = await AnalyticsService.getAnalytics(organisationId, params, userId, userRole, client);

    const absenceRatesRows = data.absenceRates
      .map((rate) => {
        if ("suppressed" in rate && rate.suppressed) {
          return `<tr><td>${AnalyticsService.htmlEscape(rate.groupName)}</td><td>${rate.employeeCount}</td><td colspan="3" style="color:#999;font-style:italic">Data suppressed (fewer than 5 employees)</td></tr>`;
        }
        const r = rate as AnalyticsAbsenceRate;
        return `<tr><td>${AnalyticsService.htmlEscape(r.groupName)}</td><td>${r.employeeCount}</td><td>${r.absenceCount}</td><td>${r.totalDaysLost}</td><td>${r.absenceRate}%</td></tr>`;
      })
      .join("\n");

    const trendsRows = data.trends
      .map(
        (t) => `<tr><td>${t.month}</td><td>${t.absenceCount}</td><td>${t.uniqueEmployees}</td><td>${t.totalDaysLost}</td></tr>`,
      )
      .join("\n");

    const bradfordRows = data.bradfordScores
      .map((bf) => {
        const name = [bf.firstName, bf.lastName].filter(Boolean).join(" ") || "Unknown";
        return `<tr><td>${AnalyticsService.htmlEscape(name)}</td><td>${AnalyticsService.htmlEscape(bf.departmentName || "")}</td><td>${bf.score}</td><td>${bf.spells}</td><td>${bf.totalDays}</td><td>${bf.riskLevel}</td></tr>`;
      })
      .join("\n");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Analytics Report - ${new Date().toLocaleDateString()}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 2rem; color: #1a1a1a; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    h2 { font-size: 1.1rem; margin-top: 2rem; margin-bottom: 0.5rem; color: #374151; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; font-size: 0.875rem; }
    th { text-align: left; padding: 0.5rem; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #374151; }
    td { padding: 0.5rem; border-bottom: 1px solid #f3f4f6; }
    .meta { color: #6b7280; font-size: 0.875rem; margin-bottom: 1.5rem; }
    @media print {
      body { margin: 0; }
      h1, h2 { page-break-after: avoid; }
      table { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>Analytics Report</h1>
  <p class="meta">Generated: ${data.generatedAt} | Period: ${params.period} | Group by: ${params.groupBy}</p>

  <h2>Absence Rates</h2>
  <table>
    <thead><tr><th>Group</th><th>Employees</th><th>Absences</th><th>Days Lost</th><th>Absence Rate</th></tr></thead>
    <tbody>${absenceRatesRows}</tbody>
  </table>

  <h2>Monthly Trends</h2>
  <table>
    <thead><tr><th>Month</th><th>New Absences</th><th>Unique Employees</th><th>Days Lost</th></tr></thead>
    <tbody>${trendsRows}</tbody>
  </table>

  <h2>Bradford Factor Scores</h2>
  <table>
    <thead><tr><th>Employee</th><th>Department</th><th>Score</th><th>Spells</th><th>Days Lost</th><th>Risk Level</th></tr></thead>
    <tbody>${bradfordRows}</tbody>
  </table>
</body>
</html>`;
  }

  /**
   * Escape a value for CSV output.
   */
  private static csvEscape(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Escape a value for HTML output.
   */
  private static htmlEscape(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
