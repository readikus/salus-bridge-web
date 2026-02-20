import { pool } from "@/providers/database/pool";
import { SicknessCase } from "@/types/database";
import { SicknessState } from "@/constants/sickness-states";
import { PoolClient } from "pg";

export interface SicknessCaseFilters {
  status?: string;
  employeeId?: string;
  search?: string;
  startDateFrom?: string;
  startDateTo?: string;
}

/**
 * Sickness case repository -- CRUD operations for sickness cases.
 * All queries use parameterised SQL with snake_case columns aliased to camelCase.
 */
export class SicknessCaseRepository {
  private static readonly SELECT_COLUMNS = `
    sc.id,
    sc.organisation_id AS "organisationId",
    sc.employee_id AS "employeeId",
    sc.reported_by AS "reportedBy",
    sc.status,
    sc.absence_type AS "absenceType",
    sc.absence_start_date AS "absenceStartDate",
    sc.absence_end_date AS "absenceEndDate",
    sc.working_days_lost AS "workingDaysLost",
    sc.notes_encrypted AS "notesEncrypted",
    sc.is_long_term AS "isLongTerm",
    sc.created_at AS "createdAt",
    sc.updated_at AS "updatedAt"
  `;

  private static readonly LIST_SELECT_COLUMNS = `
    sc.id,
    sc.organisation_id AS "organisationId",
    sc.employee_id AS "employeeId",
    sc.reported_by AS "reportedBy",
    sc.status,
    sc.absence_type AS "absenceType",
    sc.absence_start_date AS "absenceStartDate",
    sc.absence_end_date AS "absenceEndDate",
    sc.working_days_lost AS "workingDaysLost",
    sc.notes_encrypted AS "notesEncrypted",
    sc.is_long_term AS "isLongTerm",
    sc.created_at AS "createdAt",
    sc.updated_at AS "updatedAt",
    u.first_name AS "employeeFirstName",
    u.last_name AS "employeeLastName"
  `;

  private static readonly RETURNING_COLUMNS = `
    id,
    organisation_id AS "organisationId",
    employee_id AS "employeeId",
    reported_by AS "reportedBy",
    status,
    absence_type AS "absenceType",
    absence_start_date AS "absenceStartDate",
    absence_end_date AS "absenceEndDate",
    working_days_lost AS "workingDaysLost",
    notes_encrypted AS "notesEncrypted",
    is_long_term AS "isLongTerm",
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  `;

  /**
   * Find a sickness case by ID.
   */
  static async findById(id: string, client?: PoolClient): Promise<SicknessCase | null> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${SicknessCaseRepository.LIST_SELECT_COLUMNS}
      FROM sickness_cases sc
      LEFT JOIN employees e ON sc.employee_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE sc.id = $1`,
      [id],
    );

    return result.rows[0] || null;
  }

  /**
   * Find all sickness cases for an organisation with optional filters.
   * Joins employees and users for search by employee name.
   */
  static async findByOrganisation(
    organisationId: string,
    filters?: SicknessCaseFilters,
    client?: PoolClient,
  ): Promise<SicknessCase[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const conditions: string[] = ["sc.organisation_id = $1"];
    const values: string[] = [organisationId];
    let paramIndex = 2;

    if (filters?.status) {
      conditions.push(`sc.status = $${paramIndex++}`);
      values.push(filters.status);
    }
    if (filters?.employeeId) {
      conditions.push(`sc.employee_id = $${paramIndex++}`);
      values.push(filters.employeeId);
    }
    if (filters?.search) {
      conditions.push(
        `(u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR CONCAT(u.first_name, ' ', u.last_name) ILIKE $${paramIndex})`,
      );
      values.push(`%${filters.search}%`);
      paramIndex++;
    }
    // Date range filter: absences that overlap with the specified range
    // Overlap condition: absence_start_date <= endOfRange AND (absence_end_date >= startOfRange OR absence_end_date IS NULL)
    if (filters?.startDateFrom) {
      conditions.push(
        `(sc.absence_end_date >= $${paramIndex} OR sc.absence_end_date IS NULL)`,
      );
      values.push(filters.startDateFrom);
      paramIndex++;
    }
    if (filters?.startDateTo) {
      conditions.push(`sc.absence_start_date <= $${paramIndex++}`);
      values.push(filters.startDateTo);
    }

    const result = await queryFn(
      `SELECT ${SicknessCaseRepository.LIST_SELECT_COLUMNS}
      FROM sickness_cases sc
      LEFT JOIN employees e ON sc.employee_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY sc.created_at DESC`,
      values,
    );

    return result.rows;
  }

  /**
   * Find all sickness cases for a specific employee.
   */
  static async findByEmployee(employeeId: string, client?: PoolClient): Promise<SicknessCase[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${SicknessCaseRepository.LIST_SELECT_COLUMNS}
      FROM sickness_cases sc
      LEFT JOIN employees e ON sc.employee_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE sc.employee_id = $1
      ORDER BY sc.created_at DESC`,
      [employeeId],
    );

    return result.rows;
  }

  /**
   * Find all sickness cases for employees in a manager's reporting chain.
   * Uses recursive CTE matching the employee.repository.ts pattern.
   */
  static async findByManagerTeam(
    managerId: string,
    organisationId: string,
    client?: PoolClient,
  ): Promise<SicknessCase[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `WITH RECURSIVE team AS (
        SELECT id FROM employees WHERE manager_id = $1 AND organisation_id = $2
        UNION ALL
        SELECT e.id FROM employees e INNER JOIN team t ON e.manager_id = t.id
      )
      SELECT ${SicknessCaseRepository.LIST_SELECT_COLUMNS}
      FROM sickness_cases sc
      INNER JOIN team t ON sc.employee_id = t.id
      LEFT JOIN employees e ON sc.employee_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE sc.organisation_id = $2
      ORDER BY sc.created_at DESC`,
      [managerId, organisationId],
    );

    return result.rows;
  }

  /**
   * Create a new sickness case. Default status is REPORTED.
   */
  static async create(
    data: {
      organisationId: string;
      employeeId: string;
      reportedBy: string;
      absenceType: string;
      absenceStartDate: string;
      absenceEndDate?: string;
      notesEncrypted?: string;
    },
    client?: PoolClient,
  ): Promise<SicknessCase> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `INSERT INTO sickness_cases (
        organisation_id, employee_id, reported_by, status, absence_type,
        absence_start_date, absence_end_date, notes_encrypted
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING ${SicknessCaseRepository.RETURNING_COLUMNS}`,
      [
        data.organisationId,
        data.employeeId,
        data.reportedBy,
        SicknessState.REPORTED,
        data.absenceType,
        data.absenceStartDate,
        data.absenceEndDate || null,
        data.notesEncrypted || null,
      ],
    );

    return result.rows[0];
  }

  /**
   * Update the status of a sickness case.
   * Only called by WorkflowService -- not exposed as a public service method.
   */
  static async updateStatus(id: string, status: string, client?: PoolClient): Promise<SicknessCase> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `UPDATE sickness_cases
      SET status = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING ${SicknessCaseRepository.RETURNING_COLUMNS}`,
      [id, status],
    );

    return result.rows[0];
  }

  /**
   * Update the end date and working days lost for a sickness case.
   */
  static async updateEndDate(
    id: string,
    endDate: string,
    workingDaysLost: number,
    client?: PoolClient,
  ): Promise<SicknessCase> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `UPDATE sickness_cases
      SET absence_end_date = $2, working_days_lost = $3, updated_at = NOW()
      WHERE id = $1
      RETURNING ${SicknessCaseRepository.RETURNING_COLUMNS}`,
      [id, endDate, workingDaysLost],
    );

    return result.rows[0];
  }

  /**
   * Update dates and recalculated working days for a sickness case.
   */
  static async updateDates(
    id: string,
    startDate: string,
    endDate: string | null,
    workingDaysLost: number | null,
    client?: PoolClient,
  ): Promise<SicknessCase> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `UPDATE sickness_cases
      SET absence_start_date = $2, absence_end_date = $3, working_days_lost = $4, updated_at = NOW()
      WHERE id = $1
      RETURNING ${SicknessCaseRepository.RETURNING_COLUMNS}`,
      [id, startDate, endDate, workingDaysLost],
    );

    return result.rows[0];
  }

  /**
   * Update the long-term flag for a sickness case.
   */
  static async updateLongTermFlag(id: string, isLongTerm: boolean, client?: PoolClient): Promise<void> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    await queryFn(
      `UPDATE sickness_cases
      SET is_long_term = $2, updated_at = NOW()
      WHERE id = $1`,
      [id, isLongTerm],
    );
  }
}
