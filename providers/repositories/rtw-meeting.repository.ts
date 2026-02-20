import { pool } from "@/providers/database/pool";
import { RtwMeeting } from "@/types/database";
import { PoolClient } from "pg";

/**
 * RTW meeting repository -- CRUD operations for return-to-work meetings.
 * All queries use parameterised SQL with snake_case columns aliased to camelCase.
 */
export class RtwMeetingRepository {
  private static readonly SELECT_COLUMNS = `
    rm.id,
    rm.organisation_id AS "organisationId",
    rm.sickness_case_id AS "sicknessCaseId",
    rm.employee_id AS "employeeId",
    rm.scheduled_by AS "scheduledBy",
    rm.scheduled_date AS "scheduledDate",
    rm.completed_date AS "completedDate",
    rm.status,
    rm.questionnaire_responses AS "questionnaireResponses",
    rm.outcomes_encrypted AS "outcomesEncrypted",
    rm.adjustments,
    rm.created_at AS "createdAt",
    rm.updated_at AS "updatedAt"
  `;

  private static readonly RETURNING_COLUMNS = `
    id,
    organisation_id AS "organisationId",
    sickness_case_id AS "sicknessCaseId",
    employee_id AS "employeeId",
    scheduled_by AS "scheduledBy",
    scheduled_date AS "scheduledDate",
    completed_date AS "completedDate",
    status,
    questionnaire_responses AS "questionnaireResponses",
    outcomes_encrypted AS "outcomesEncrypted",
    adjustments,
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  `;

  /**
   * Create a new RTW meeting record.
   */
  static async create(
    data: {
      organisationId: string;
      sicknessCaseId: string;
      employeeId: string;
      scheduledBy: string;
      scheduledDate: string;
    },
    client?: PoolClient,
  ): Promise<RtwMeeting> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `INSERT INTO rtw_meetings (
        organisation_id, sickness_case_id, employee_id, scheduled_by,
        scheduled_date, status
      )
      VALUES ($1, $2, $3, $4, $5, 'SCHEDULED')
      RETURNING ${RtwMeetingRepository.RETURNING_COLUMNS}`,
      [data.organisationId, data.sicknessCaseId, data.employeeId, data.scheduledBy, data.scheduledDate],
    );

    return result.rows[0];
  }

  /**
   * Find an RTW meeting by ID.
   */
  static async findById(id: string, client?: PoolClient): Promise<RtwMeeting | null> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${RtwMeetingRepository.SELECT_COLUMNS}
      FROM rtw_meetings rm
      WHERE rm.id = $1`,
      [id],
    );

    return result.rows[0] || null;
  }

  /**
   * Find all RTW meetings for a sickness case.
   */
  static async findByCaseId(caseId: string, client?: PoolClient): Promise<RtwMeeting[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${RtwMeetingRepository.SELECT_COLUMNS}
      FROM rtw_meetings rm
      WHERE rm.sickness_case_id = $1
      ORDER BY rm.created_at DESC`,
      [caseId],
    );

    return result.rows;
  }

  /**
   * Update an RTW meeting with dynamic fields.
   */
  static async update(
    id: string,
    data: {
      completedDate?: string;
      status?: string;
      questionnaireResponses?: Record<string, unknown>;
      outcomesEncrypted?: string;
      adjustments?: Array<{ type: string; description: string; reviewDate?: string }>;
    },
    client?: PoolClient,
  ): Promise<RtwMeeting> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const setClauses: string[] = ["updated_at = NOW()"];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.completedDate !== undefined) {
      setClauses.push(`completed_date = $${paramIndex++}`);
      values.push(data.completedDate);
    }
    if (data.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.questionnaireResponses !== undefined) {
      setClauses.push(`questionnaire_responses = $${paramIndex++}`);
      values.push(JSON.stringify(data.questionnaireResponses));
    }
    if (data.outcomesEncrypted !== undefined) {
      setClauses.push(`outcomes_encrypted = $${paramIndex++}`);
      values.push(data.outcomesEncrypted);
    }
    if (data.adjustments !== undefined) {
      setClauses.push(`adjustments = $${paramIndex++}`);
      values.push(JSON.stringify(data.adjustments));
    }

    values.push(id);

    const result = await queryFn(
      `UPDATE rtw_meetings
      SET ${setClauses.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING ${RtwMeetingRepository.RETURNING_COLUMNS}`,
      values,
    );

    return result.rows[0];
  }
}
