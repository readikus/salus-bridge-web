import { pool } from "@/providers/database/pool";
import { TriggerAlert, TriggerAlertWithDetails } from "@/types/database";
import { PoolClient } from "pg";

export interface TriggerAlertFilters {
  employeeId?: string;
  acknowledged?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * TriggerAlert repository -- CRUD operations for trigger alerts.
 * All queries use parameterised SQL with snake_case columns aliased to camelCase.
 */
export class TriggerAlertRepository {
  private static readonly SELECT_COLUMNS = `
    ta.id,
    ta.organisation_id AS "organisationId",
    ta.trigger_config_id AS "triggerConfigId",
    ta.employee_id AS "employeeId",
    ta.sickness_case_id AS "sicknessCaseId",
    ta.triggered_value AS "triggeredValue",
    ta.acknowledged_by AS "acknowledgedBy",
    ta.acknowledged_at AS "acknowledgedAt",
    ta.created_at AS "createdAt"
  `;

  private static readonly RETURNING_COLUMNS = `
    id,
    organisation_id AS "organisationId",
    trigger_config_id AS "triggerConfigId",
    employee_id AS "employeeId",
    sickness_case_id AS "sicknessCaseId",
    triggered_value AS "triggeredValue",
    acknowledged_by AS "acknowledgedBy",
    acknowledged_at AS "acknowledgedAt",
    created_at AS "createdAt"
  `;

  private static readonly SELECT_WITH_DETAILS = `
    ta.id,
    ta.organisation_id AS "organisationId",
    ta.trigger_config_id AS "triggerConfigId",
    ta.employee_id AS "employeeId",
    ta.sickness_case_id AS "sicknessCaseId",
    ta.triggered_value AS "triggeredValue",
    ta.acknowledged_by AS "acknowledgedBy",
    ta.acknowledged_at AS "acknowledgedAt",
    ta.created_at AS "createdAt",
    tc.name AS "triggerName",
    tc.trigger_type AS "triggerType",
    tc.threshold_value AS "thresholdValue",
    u.first_name AS "employeeFirstName",
    u.last_name AS "employeeLastName"
  `;

  /**
   * Find alerts for an organisation with optional filters.
   */
  static async findByOrganisation(
    orgId: string,
    filters?: TriggerAlertFilters,
    client?: PoolClient,
  ): Promise<TriggerAlertWithDetails[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const conditions: string[] = ["ta.organisation_id = $1"];
    const values: (string | number | boolean)[] = [orgId];
    let paramIndex = 2;

    if (filters?.employeeId) {
      conditions.push(`ta.employee_id = $${paramIndex++}`);
      values.push(filters.employeeId);
    }
    if (filters?.acknowledged === true) {
      conditions.push("ta.acknowledged_at IS NOT NULL");
    } else if (filters?.acknowledged === false) {
      conditions.push("ta.acknowledged_at IS NULL");
    }

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const result = await queryFn(
      `SELECT ${TriggerAlertRepository.SELECT_WITH_DETAILS}
      FROM trigger_alerts ta
      INNER JOIN trigger_configs tc ON ta.trigger_config_id = tc.id
      INNER JOIN employees e ON ta.employee_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE ${conditions.join(" AND ")}
      ORDER BY ta.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...values, limit, offset],
    );

    return result.rows;
  }

  /**
   * Find all alerts for a specific employee.
   */
  static async findByEmployee(employeeId: string, client?: PoolClient): Promise<TriggerAlert[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${TriggerAlertRepository.SELECT_COLUMNS}
      FROM trigger_alerts ta
      WHERE ta.employee_id = $1
      ORDER BY ta.created_at DESC`,
      [employeeId],
    );

    return result.rows;
  }

  /**
   * Create a new trigger alert record.
   */
  static async create(
    data: {
      organisationId: string;
      triggerConfigId: string;
      employeeId: string;
      sicknessCaseId?: string | null;
      triggeredValue: number;
    },
    client?: PoolClient,
  ): Promise<TriggerAlert> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `INSERT INTO trigger_alerts (organisation_id, trigger_config_id, employee_id, sickness_case_id, triggered_value)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING ${TriggerAlertRepository.RETURNING_COLUMNS}`,
      [data.organisationId, data.triggerConfigId, data.employeeId, data.sicknessCaseId ?? null, data.triggeredValue],
    );

    return result.rows[0];
  }

  /**
   * Mark an alert as acknowledged.
   */
  static async acknowledge(id: string, userId: string, client?: PoolClient): Promise<TriggerAlert> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `UPDATE trigger_alerts
      SET acknowledged_by = $2, acknowledged_at = NOW()
      WHERE id = $1
      RETURNING ${TriggerAlertRepository.RETURNING_COLUMNS}`,
      [id, userId],
    );

    return result.rows[0];
  }

  /**
   * Check if an alert already exists for a given trigger config + sickness case combination.
   * Used for deduplication to prevent duplicate alerts.
   */
  static async existsForTriggerAndCase(
    triggerConfigId: string,
    sicknessCaseId: string,
    client?: PoolClient,
  ): Promise<boolean> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT 1 FROM trigger_alerts
      WHERE trigger_config_id = $1 AND sickness_case_id = $2
      LIMIT 1`,
      [triggerConfigId, sicknessCaseId],
    );

    return result.rows.length > 0;
  }
}
