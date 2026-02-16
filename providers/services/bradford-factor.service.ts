import { SicknessCaseRepository } from "@/providers/repositories/sickness-case.repository";
import { BRADFORD_LOOKBACK_WEEKS, getBradfordRiskLevel } from "@/constants/bradford-factor";
import { PoolClient } from "pg";

export interface BradfordFactorResult {
  score: number;
  spells: number;
  totalDays: number;
  riskLevel: string;
}

/**
 * BradfordFactorService -- calculates the Bradford Factor for employees.
 *
 * Formula: S * S * D
 * Where S = number of absence spells in the lookback period
 * and D = total working days lost across all spells.
 *
 * Standard lookback: 52 weeks (rolling year).
 */
export class BradfordFactorService {
  /**
   * Calculate the Bradford Factor for a single employee.
   * Fetches all sickness cases in the last 52 weeks and computes S*S*D.
   * For ongoing cases (no end date), counts weekdays from start to today.
   */
  static async calculate(employeeId: string, client?: PoolClient): Promise<BradfordFactorResult> {
    const cases = await SicknessCaseRepository.findByEmployee(employeeId, client);

    // Calculate lookback cutoff date
    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - BRADFORD_LOOKBACK_WEEKS * 7);

    // Filter cases where absenceStartDate is within the lookback period
    const relevantCases = cases.filter((c) => {
      const startDate = new Date(c.absenceStartDate);
      return startDate >= cutoffDate;
    });

    // S = number of absence spells
    const spells = relevantCases.length;

    // D = total working days lost
    let totalDays = 0;
    for (const c of relevantCases) {
      if (c.workingDaysLost !== null && c.workingDaysLost !== undefined) {
        totalDays += c.workingDaysLost;
      } else {
        // Ongoing case: count weekdays from start to today
        const startDate = new Date(c.absenceStartDate);
        totalDays += BradfordFactorService.countWeekdays(startDate, now);
      }
    }

    // Bradford Factor = S * S * D
    const score = spells * spells * totalDays;

    const riskLevel = getBradfordRiskLevel(score);

    return {
      score,
      spells,
      totalDays,
      riskLevel: riskLevel.label,
    };
  }

  /**
   * Calculate Bradford Factor for multiple employees.
   * Returns a Map of employeeId -> BradfordFactorResult.
   */
  static async calculateForTeam(
    employeeIds: string[],
    client?: PoolClient,
  ): Promise<Map<string, BradfordFactorResult>> {
    const results = new Map<string, BradfordFactorResult>();

    for (const employeeId of employeeIds) {
      const result = await BradfordFactorService.calculate(employeeId, client);
      results.set(employeeId, result);
    }

    return results;
  }

  /**
   * Count weekdays between two dates (inclusive of start, exclusive of end).
   * Simple weekday count -- bank holidays are not relevant for Bradford Factor.
   */
  private static countWeekdays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);

    while (current < endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return Math.max(count, 1); // Minimum 1 day for any absence spell
  }
}
