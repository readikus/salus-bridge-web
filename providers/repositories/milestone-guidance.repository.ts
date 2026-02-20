import { pool } from "@/providers/database/pool";
import { MilestoneGuidanceRecord } from "@/types/database";
import { PoolClient } from "pg";

/**
 * MilestoneGuidance repository -- CRUD operations for milestone guidance content.
 * All queries use parameterised SQL with snake_case columns aliased to camelCase.
 */
export class MilestoneGuidanceRepository {
  private static readonly SELECT_COLUMNS = `
    mg.id,
    mg.organisation_id AS "organisationId",
    mg.milestone_key AS "milestoneKey",
    mg.action_title AS "actionTitle",
    mg.manager_guidance AS "managerGuidance",
    mg.suggested_text AS "suggestedText",
    mg.instructions,
    mg.employee_view AS "employeeView",
    mg.is_default AS "isDefault",
    mg.created_at AS "createdAt",
    mg.updated_at AS "updatedAt"
  `;

  private static readonly RETURNING_COLUMNS = `
    id,
    organisation_id AS "organisationId",
    milestone_key AS "milestoneKey",
    action_title AS "actionTitle",
    manager_guidance AS "managerGuidance",
    suggested_text AS "suggestedText",
    instructions,
    employee_view AS "employeeView",
    is_default AS "isDefault",
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  `;

  /**
   * Find all system default milestone guidance entries.
   */
  static async findDefaults(client?: PoolClient): Promise<MilestoneGuidanceRecord[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${MilestoneGuidanceRepository.SELECT_COLUMNS}
      FROM milestone_guidance mg
      WHERE mg.organisation_id IS NULL AND mg.is_default = true
      ORDER BY mg.milestone_key`,
    );

    return result.rows;
  }

  /**
   * Find all milestone guidance entries for an organisation (overrides only).
   */
  static async findByOrganisation(orgId: string, client?: PoolClient): Promise<MilestoneGuidanceRecord[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${MilestoneGuidanceRepository.SELECT_COLUMNS}
      FROM milestone_guidance mg
      WHERE mg.organisation_id = $1
      ORDER BY mg.milestone_key`,
      [orgId],
    );

    return result.rows;
  }

  /**
   * Find guidance for a specific milestone key.
   * If orgId is provided, returns the org override if it exists, otherwise the default.
   * Uses ORDER BY organisation_id DESC NULLS LAST to prefer org-specific rows.
   */
  static async findByMilestoneKey(
    milestoneKey: string,
    orgId?: string,
    client?: PoolClient,
  ): Promise<MilestoneGuidanceRecord | null> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);

    if (orgId) {
      const result = await queryFn(
        `SELECT ${MilestoneGuidanceRepository.SELECT_COLUMNS}
        FROM milestone_guidance mg
        WHERE mg.milestone_key = $1 AND (mg.organisation_id = $2 OR mg.organisation_id IS NULL)
        ORDER BY mg.organisation_id DESC NULLS LAST
        LIMIT 1`,
        [milestoneKey, orgId],
      );
      return result.rows[0] || null;
    }

    const result = await queryFn(
      `SELECT ${MilestoneGuidanceRepository.SELECT_COLUMNS}
      FROM milestone_guidance mg
      WHERE mg.milestone_key = $1 AND mg.organisation_id IS NULL
      LIMIT 1`,
      [milestoneKey],
    );
    return result.rows[0] || null;
  }

  /**
   * Find guidance for a specific org + milestone key combination.
   */
  static async findByOrgAndKey(
    orgId: string,
    milestoneKey: string,
    client?: PoolClient,
  ): Promise<MilestoneGuidanceRecord | null> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${MilestoneGuidanceRepository.SELECT_COLUMNS}
      FROM milestone_guidance mg
      WHERE mg.organisation_id = $1 AND mg.milestone_key = $2`,
      [orgId, milestoneKey],
    );

    return result.rows[0] || null;
  }

  /**
   * Create a new milestone guidance entry.
   */
  static async create(
    data: {
      organisationId: string;
      milestoneKey: string;
      actionTitle: string;
      managerGuidance: string;
      suggestedText: string;
      instructions: string[];
      employeeView: string;
    },
    client?: PoolClient,
  ): Promise<MilestoneGuidanceRecord> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `INSERT INTO milestone_guidance (organisation_id, milestone_key, action_title, manager_guidance, suggested_text, instructions, employee_view, is_default)
      VALUES ($1, $2, $3, $4, $5, $6, $7, false)
      RETURNING ${MilestoneGuidanceRepository.RETURNING_COLUMNS}`,
      [
        data.organisationId,
        data.milestoneKey,
        data.actionTitle,
        data.managerGuidance,
        data.suggestedText,
        JSON.stringify(data.instructions),
        data.employeeView,
      ],
    );

    return result.rows[0];
  }

  /**
   * Update a milestone guidance entry (partial update).
   */
  static async update(
    id: string,
    data: {
      actionTitle?: string;
      managerGuidance?: string;
      suggestedText?: string;
      instructions?: string[];
      employeeView?: string;
    },
    client?: PoolClient,
  ): Promise<MilestoneGuidanceRecord> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const setClauses: string[] = [];
    const values: (string | null)[] = [];
    let paramIndex = 1;

    if (data.actionTitle !== undefined) {
      setClauses.push(`action_title = $${paramIndex++}`);
      values.push(data.actionTitle);
    }
    if (data.managerGuidance !== undefined) {
      setClauses.push(`manager_guidance = $${paramIndex++}`);
      values.push(data.managerGuidance);
    }
    if (data.suggestedText !== undefined) {
      setClauses.push(`suggested_text = $${paramIndex++}`);
      values.push(data.suggestedText);
    }
    if (data.instructions !== undefined) {
      setClauses.push(`instructions = $${paramIndex++}`);
      values.push(JSON.stringify(data.instructions));
    }
    if (data.employeeView !== undefined) {
      setClauses.push(`employee_view = $${paramIndex++}`);
      values.push(data.employeeView);
    }

    setClauses.push("updated_at = NOW()");
    values.push(id);

    const result = await queryFn(
      `UPDATE milestone_guidance
      SET ${setClauses.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING ${MilestoneGuidanceRepository.RETURNING_COLUMNS}`,
      values,
    );

    return result.rows[0];
  }

  /**
   * Delete a milestone guidance entry (hard delete).
   */
  static async delete(id: string, client?: PoolClient): Promise<void> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    await queryFn("DELETE FROM milestone_guidance WHERE id = $1", [id]);
  }

  /**
   * Delete guidance override by org + milestone key (for reset-to-default flow).
   */
  static async deleteByOrgAndKey(orgId: string, milestoneKey: string, client?: PoolClient): Promise<void> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    await queryFn("DELETE FROM milestone_guidance WHERE organisation_id = $1 AND milestone_key = $2", [
      orgId,
      milestoneKey,
    ]);
  }
}
