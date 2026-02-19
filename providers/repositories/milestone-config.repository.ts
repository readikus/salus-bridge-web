import { pool } from "@/providers/database/pool";
import { MilestoneConfig } from "@/types/database";
import { PoolClient } from "pg";

/**
 * MilestoneConfig repository -- CRUD operations for milestone configurations.
 * All queries use parameterised SQL with snake_case columns aliased to camelCase.
 */
export class MilestoneConfigRepository {
  private static readonly SELECT_COLUMNS = `
    mc.id,
    mc.organisation_id AS "organisationId",
    mc.milestone_key AS "milestoneKey",
    mc.label,
    mc.day_offset AS "dayOffset",
    mc.description,
    mc.is_active AS "isActive",
    mc.is_default AS "isDefault",
    mc.created_by AS "createdBy",
    mc.created_at AS "createdAt",
    mc.updated_at AS "updatedAt"
  `;

  /**
   * Find all system default milestone configs.
   */
  static async findDefaults(client?: PoolClient): Promise<MilestoneConfig[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${MilestoneConfigRepository.SELECT_COLUMNS}
      FROM milestone_configs mc
      WHERE mc.organisation_id IS NULL AND mc.is_default = true
      ORDER BY mc.day_offset ASC`,
    );

    return result.rows;
  }

  /**
   * Find all milestone configs for an organisation (overrides only).
   */
  static async findByOrganisation(orgId: string, client?: PoolClient): Promise<MilestoneConfig[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${MilestoneConfigRepository.SELECT_COLUMNS}
      FROM milestone_configs mc
      WHERE mc.organisation_id = $1
      ORDER BY mc.day_offset ASC`,
      [orgId],
    );

    return result.rows;
  }

  /**
   * Find a single milestone config by ID.
   */
  static async findById(id: string, client?: PoolClient): Promise<MilestoneConfig | null> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${MilestoneConfigRepository.SELECT_COLUMNS}
      FROM milestone_configs mc
      WHERE mc.id = $1`,
      [id],
    );

    return result.rows[0] || null;
  }

  /**
   * Create a new milestone config.
   */
  static async create(
    data: {
      organisationId: string;
      milestoneKey: string;
      label: string;
      dayOffset: number;
      description?: string | null;
      isActive?: boolean;
      createdBy: string;
    },
    client?: PoolClient,
  ): Promise<MilestoneConfig> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `INSERT INTO milestone_configs (organisation_id, milestone_key, label, day_offset, description, is_active, is_default, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, false, $7)
      RETURNING ${MilestoneConfigRepository.SELECT_COLUMNS}`,
      [
        data.organisationId,
        data.milestoneKey,
        data.label,
        data.dayOffset,
        data.description ?? null,
        data.isActive ?? true,
        data.createdBy,
      ],
    );

    return result.rows[0];
  }

  /**
   * Update a milestone config (partial update).
   */
  static async update(
    id: string,
    data: {
      label?: string;
      dayOffset?: number;
      description?: string | null;
      isActive?: boolean;
    },
    client?: PoolClient,
  ): Promise<MilestoneConfig> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const setClauses: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let paramIndex = 1;

    if (data.label !== undefined) {
      setClauses.push(`label = $${paramIndex++}`);
      values.push(data.label);
    }
    if (data.dayOffset !== undefined) {
      setClauses.push(`day_offset = $${paramIndex++}`);
      values.push(data.dayOffset);
    }
    if (data.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.isActive !== undefined) {
      setClauses.push(`is_active = $${paramIndex++}`);
      values.push(data.isActive);
    }

    setClauses.push("updated_at = NOW()");
    values.push(id);

    const result = await queryFn(
      `UPDATE milestone_configs mc
      SET ${setClauses.join(", ")}
      WHERE mc.id = $${paramIndex}
      RETURNING ${MilestoneConfigRepository.SELECT_COLUMNS}`,
      values,
    );

    return result.rows[0];
  }

  /**
   * Delete a milestone config (hard delete).
   */
  static async delete(id: string, client?: PoolClient): Promise<void> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    await queryFn("DELETE FROM milestone_configs WHERE id = $1", [id]);
  }

  /**
   * Find a milestone config by organisation and milestone key.
   */
  static async findByOrgAndKey(
    orgId: string,
    milestoneKey: string,
    client?: PoolClient,
  ): Promise<MilestoneConfig | null> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${MilestoneConfigRepository.SELECT_COLUMNS}
      FROM milestone_configs mc
      WHERE mc.organisation_id = $1 AND mc.milestone_key = $2`,
      [orgId, milestoneKey],
    );

    return result.rows[0] || null;
  }
}
