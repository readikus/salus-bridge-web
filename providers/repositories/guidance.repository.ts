import { pool } from "@/providers/database/pool";
import { GuidanceEngagement } from "@/types/database";
import { PoolClient } from "pg";

/**
 * Guidance engagement repository -- tracks which guidance steps a manager has reviewed.
 * All queries use parameterised SQL with snake_case columns aliased to camelCase.
 */
export class GuidanceRepository {
  private static readonly SELECT_COLUMNS = `
    ge.id,
    ge.organisation_id AS "organisationId",
    ge.sickness_case_id AS "sicknessCaseId",
    ge.user_id AS "userId",
    ge.guidance_type AS "guidanceType",
    ge.guidance_step AS "guidanceStep",
    ge.engaged_at AS "engagedAt"
  `;

  /**
   * Create a guidance engagement record.
   */
  static async createEngagement(
    data: {
      organisationId: string;
      sicknessCaseId: string;
      userId: string;
      guidanceType: string;
      guidanceStep: string;
    },
    client?: PoolClient,
  ): Promise<GuidanceEngagement> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `INSERT INTO guidance_engagement (
        organisation_id, sickness_case_id, user_id, guidance_type, guidance_step
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING ${GuidanceRepository.SELECT_COLUMNS}`,
      [data.organisationId, data.sicknessCaseId, data.userId, data.guidanceType, data.guidanceStep],
    );

    return result.rows[0];
  }

  /**
   * Find engaged guidance steps for a specific user on a specific case.
   */
  static async findEngagementByCaseAndUser(
    caseId: string,
    userId: string,
    client?: PoolClient,
  ): Promise<GuidanceEngagement[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${GuidanceRepository.SELECT_COLUMNS}
      FROM guidance_engagement ge
      WHERE ge.sickness_case_id = $1 AND ge.user_id = $2
      ORDER BY ge.engaged_at DESC`,
      [caseId, userId],
    );

    return result.rows;
  }

  /**
   * Find all engagement records for a case.
   */
  static async findEngagementByCase(caseId: string, client?: PoolClient): Promise<GuidanceEngagement[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${GuidanceRepository.SELECT_COLUMNS}
      FROM guidance_engagement ge
      WHERE ge.sickness_case_id = $1
      ORDER BY ge.engaged_at DESC`,
      [caseId],
    );

    return result.rows;
  }
}
