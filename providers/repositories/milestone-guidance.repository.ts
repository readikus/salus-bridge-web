import { pool } from "@/providers/database/pool";
import { MilestoneGuidanceRecord } from "@/types/database";
import { PoolClient } from "pg";

/**
 * MilestoneGuidance repository -- read operations for milestone guidance content.
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
}
