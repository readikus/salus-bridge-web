import { pool } from "@/providers/database/pool";
import { CaseTransition } from "@/types/database";
import { PoolClient } from "pg";

/**
 * Case transition repository -- tracks all state changes for sickness cases.
 * Creates an immutable audit trail of workflow transitions.
 */
export class CaseTransitionRepository {
  private static readonly SELECT_COLUMNS = `
    id,
    sickness_case_id AS "sicknessCaseId",
    from_status AS "fromStatus",
    to_status AS "toStatus",
    action,
    performed_by AS "performedBy",
    notes,
    created_at AS "createdAt"
  `;

  /**
   * Create a new case transition record.
   */
  static async create(
    data: {
      sicknessCaseId: string;
      fromStatus: string | null;
      toStatus: string;
      action: string;
      performedBy: string;
      notes?: string;
    },
    client?: PoolClient,
  ): Promise<CaseTransition> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `INSERT INTO case_transitions (sickness_case_id, from_status, to_status, action, performed_by, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING ${CaseTransitionRepository.SELECT_COLUMNS}`,
      [
        data.sicknessCaseId,
        data.fromStatus,
        data.toStatus,
        data.action,
        data.performedBy,
        data.notes || null,
      ],
    );

    return result.rows[0];
  }

  /**
   * Find all transitions for a sickness case in chronological order.
   */
  static async findByCaseId(caseId: string, client?: PoolClient): Promise<CaseTransition[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${CaseTransitionRepository.SELECT_COLUMNS}
      FROM case_transitions
      WHERE sickness_case_id = $1
      ORDER BY created_at ASC`,
      [caseId],
    );

    return result.rows;
  }
}
