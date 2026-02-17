import { pool } from "@/providers/database/pool";
import { PoolClient } from "pg";

export interface AbsenceRateRow {
  groupId: string;
  groupName: string;
  employeeCount: number;
  absenceCount: number;
  totalDaysLost: number;
  absenceRate: number;
}

export interface MonthlyTrendRow {
  month: string;
  absenceCount: number;
  uniqueEmployees: number;
  totalDaysLost: number;
}

export interface DepartmentCountRow {
  departmentId: string;
  departmentName: string;
  employeeCount: number;
}

/**
 * AnalyticsRepository -- aggregation SQL queries for absence rates, trends, and department counts.
 * All queries use parameterised SQL with snake_case columns aliased to camelCase.
 */
export class AnalyticsRepository {
  /**
   * Get absence rates grouped by team (manager), department, or organisation.
   * absenceRate = (employees with at least 1 absence / total employees) * 100
   */
  static async getAbsenceRates(
    organisationId: string,
    periodMonths: number,
    groupBy: "team" | "department" | "organisation",
    client?: PoolClient,
  ): Promise<AbsenceRateRow[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);

    let groupColumn: string;
    let groupIdColumn: string;
    let groupNameColumn: string;
    let groupJoin = "";

    switch (groupBy) {
      case "team":
        groupIdColumn = "COALESCE(e.manager_id, e.id)";
        groupNameColumn = "COALESCE(CONCAT(mu.first_name, ' ', mu.last_name, '''s Team'), 'Unassigned')";
        groupColumn = "COALESCE(e.manager_id, e.id)";
        groupJoin = `
          LEFT JOIN employees me ON COALESCE(e.manager_id, e.id) = me.id
          LEFT JOIN users mu ON me.user_id = mu.id
        `;
        break;
      case "organisation":
        groupIdColumn = "e.organisation_id";
        groupNameColumn = "o.name";
        groupJoin = "LEFT JOIN organisations o ON e.organisation_id = o.id";
        groupColumn = "e.organisation_id";
        break;
      case "department":
      default:
        groupIdColumn = "COALESCE(e.department_id::text, 'none')";
        groupNameColumn = "COALESCE(d.name, 'No Department')";
        groupJoin = "LEFT JOIN departments d ON e.department_id = d.id";
        groupColumn = "COALESCE(e.department_id::text, 'none')";
        break;
    }

    const result = await queryFn(
      `WITH employee_absences AS (
        SELECT
          e.id AS employee_id,
          ${groupIdColumn} AS group_id,
          ${groupNameColumn} AS group_name,
          COUNT(DISTINCT sc.id) AS absence_count,
          COALESCE(SUM(sc.working_days_lost), 0) AS days_lost
        FROM employees e
        ${groupJoin}
        LEFT JOIN sickness_cases sc ON sc.employee_id = e.id
          AND sc.absence_start_date >= NOW() - INTERVAL '${periodMonths} months'
        WHERE e.organisation_id = $1
          AND e.status = 'ACTIVE'
        GROUP BY e.id, ${groupColumn}, ${groupNameColumn}
      )
      SELECT
        group_id AS "groupId",
        group_name AS "groupName",
        COUNT(*)::int AS "employeeCount",
        COUNT(*) FILTER (WHERE absence_count > 0)::int AS "absenceCount",
        SUM(days_lost)::int AS "totalDaysLost",
        ROUND(
          (COUNT(*) FILTER (WHERE absence_count > 0)::numeric / NULLIF(COUNT(*), 0)) * 100, 1
        ) AS "absenceRate"
      FROM employee_absences
      GROUP BY group_id, group_name
      ORDER BY group_name ASC`,
      [organisationId],
    );

    return result.rows;
  }

  /**
   * Get monthly absence trends for an organisation.
   * Groups sickness cases by month and returns counts.
   */
  static async getMonthlyTrends(
    organisationId: string,
    periodMonths: number,
    client?: PoolClient,
  ): Promise<MonthlyTrendRow[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);

    const result = await queryFn(
      `SELECT
        TO_CHAR(DATE_TRUNC('month', sc.absence_start_date), 'YYYY-MM') AS "month",
        COUNT(*)::int AS "absenceCount",
        COUNT(DISTINCT sc.employee_id)::int AS "uniqueEmployees",
        COALESCE(SUM(sc.working_days_lost), 0)::int AS "totalDaysLost"
      FROM sickness_cases sc
      INNER JOIN employees e ON sc.employee_id = e.id
      WHERE sc.organisation_id = $1
        AND sc.absence_start_date >= NOW() - INTERVAL '${periodMonths} months'
      GROUP BY DATE_TRUNC('month', sc.absence_start_date)
      ORDER BY DATE_TRUNC('month', sc.absence_start_date) ASC`,
      [organisationId],
    );

    return result.rows;
  }

  /**
   * Get employee counts per department for cohort size checking.
   */
  static async getDepartmentEmployeeCounts(
    organisationId: string,
    client?: PoolClient,
  ): Promise<DepartmentCountRow[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);

    const result = await queryFn(
      `SELECT
        COALESCE(e.department_id::text, 'none') AS "departmentId",
        COALESCE(d.name, 'No Department') AS "departmentName",
        COUNT(*)::int AS "employeeCount"
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE e.organisation_id = $1
        AND e.status = 'ACTIVE'
      GROUP BY e.department_id, d.name
      ORDER BY d.name ASC NULLS LAST`,
      [organisationId],
    );

    return result.rows;
  }
}
