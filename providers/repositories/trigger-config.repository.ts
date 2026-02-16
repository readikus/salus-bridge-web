import { pool } from "@/providers/database/pool";
import { TriggerConfig } from "@/types/database";
import { PoolClient } from "pg";

/**
 * TriggerConfig repository -- CRUD operations for trigger configurations.
 * All queries use parameterised SQL with snake_case columns aliased to camelCase.
 */
export class TriggerConfigRepository {
  private static readonly SELECT_COLUMNS = `
    tc.id,
    tc.organisation_id AS "organisationId",
    tc.name,
    tc.trigger_type AS "triggerType",
    tc.threshold_value AS "thresholdValue",
    tc.period_days AS "periodDays",
    tc.is_active AS "isActive",
    tc.created_by AS "createdBy",
    tc.created_at AS "createdAt",
    tc.updated_at AS "updatedAt"
  `;

  /**
   * Find all trigger configs for an organisation, ordered by created_at.
   */
  static async findByOrganisation(orgId: string, client?: PoolClient): Promise<TriggerConfig[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${TriggerConfigRepository.SELECT_COLUMNS}
      FROM trigger_configs tc
      WHERE tc.organisation_id = $1
      ORDER BY tc.created_at ASC`,
      [orgId],
    );

    return result.rows;
  }

  /**
   * Find a single trigger config by ID.
   */
  static async findById(id: string, client?: PoolClient): Promise<TriggerConfig | null> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${TriggerConfigRepository.SELECT_COLUMNS}
      FROM trigger_configs tc
      WHERE tc.id = $1`,
      [id],
    );

    return result.rows[0] || null;
  }

  /**
   * Find only active trigger configs for an organisation.
   */
  static async findActiveByOrganisation(orgId: string, client?: PoolClient): Promise<TriggerConfig[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${TriggerConfigRepository.SELECT_COLUMNS}
      FROM trigger_configs tc
      WHERE tc.organisation_id = $1 AND tc.is_active = true
      ORDER BY tc.created_at ASC`,
      [orgId],
    );

    return result.rows;
  }

  /**
   * Create a new trigger config.
   */
  static async create(
    data: {
      organisationId: string;
      name: string;
      triggerType: string;
      thresholdValue: number;
      periodDays?: number | null;
      isActive?: boolean;
      createdBy: string;
    },
    client?: PoolClient,
  ): Promise<TriggerConfig> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `INSERT INTO trigger_configs (organisation_id, name, trigger_type, threshold_value, period_days, is_active, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING ${TriggerConfigRepository.SELECT_COLUMNS}`,
      [
        data.organisationId,
        data.name,
        data.triggerType,
        data.thresholdValue,
        data.periodDays ?? null,
        data.isActive ?? true,
        data.createdBy,
      ],
    );

    return result.rows[0];
  }

  /**
   * Update a trigger config (partial update).
   */
  static async update(
    id: string,
    data: {
      name?: string;
      triggerType?: string;
      thresholdValue?: number;
      periodDays?: number | null;
      isActive?: boolean;
    },
    client?: PoolClient,
  ): Promise<TriggerConfig> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const setClauses: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.triggerType !== undefined) {
      setClauses.push(`trigger_type = $${paramIndex++}`);
      values.push(data.triggerType);
    }
    if (data.thresholdValue !== undefined) {
      setClauses.push(`threshold_value = $${paramIndex++}`);
      values.push(data.thresholdValue);
    }
    if (data.periodDays !== undefined) {
      setClauses.push(`period_days = $${paramIndex++}`);
      values.push(data.periodDays);
    }
    if (data.isActive !== undefined) {
      setClauses.push(`is_active = $${paramIndex++}`);
      values.push(data.isActive);
    }

    setClauses.push("updated_at = NOW()");
    values.push(id);

    const result = await queryFn(
      `UPDATE trigger_configs tc
      SET ${setClauses.join(", ")}
      WHERE tc.id = $${paramIndex}
      RETURNING ${TriggerConfigRepository.SELECT_COLUMNS}`,
      values,
    );

    return result.rows[0];
  }

  /**
   * Delete a trigger config (hard delete).
   */
  static async delete(id: string, client?: PoolClient): Promise<void> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    await queryFn("DELETE FROM trigger_configs WHERE id = $1", [id]);
  }
}
