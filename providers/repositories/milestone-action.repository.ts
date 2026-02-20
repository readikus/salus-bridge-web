import { pool } from "@/providers/database/pool";
import { MilestoneAction, MilestoneActionWithDetails } from "@/types/database";
import { PoolClient } from "pg";

/**
 * MilestoneAction repository -- CRUD and query operations for milestone action tracking.
 * All queries use parameterised SQL with snake_case columns aliased to camelCase.
 */
export class MilestoneActionRepository {
  private static readonly SELECT_COLUMNS = `
    ma.id,
    ma.organisation_id AS "organisationId",
    ma.sickness_case_id AS "sicknessCaseId",
    ma.milestone_key AS "milestoneKey",
    ma.action_type AS "actionType",
    ma.status,
    ma.due_date AS "dueDate",
    ma.completed_by AS "completedBy",
    ma.completed_at AS "completedAt",
    ma.notes,
    ma.created_at AS "createdAt",
    ma.updated_at AS "updatedAt"
  `;

  /** Column list without table alias — used in INSERT ... RETURNING where no alias is available. */
  private static readonly RETURNING_COLUMNS = `
    id,
    organisation_id AS "organisationId",
    sickness_case_id AS "sicknessCaseId",
    milestone_key AS "milestoneKey",
    action_type AS "actionType",
    status,
    due_date AS "dueDate",
    completed_by AS "completedBy",
    completed_at AS "completedAt",
    notes,
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  `;

  /**
   * Find all milestone actions for a sickness case, sorted by due date.
   */
  static async findBySicknessCase(sicknessCaseId: string, client?: PoolClient): Promise<MilestoneAction[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${MilestoneActionRepository.SELECT_COLUMNS}
      FROM milestone_actions ma
      WHERE ma.sickness_case_id = $1
      ORDER BY ma.due_date ASC`,
      [sicknessCaseId],
    );

    return result.rows;
  }

  /**
   * Find all milestone actions for a sickness case with milestone label and employee details.
   */
  static async findBySicknessCaseWithDetails(
    sicknessCaseId: string,
    client?: PoolClient,
  ): Promise<MilestoneActionWithDetails[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${MilestoneActionRepository.SELECT_COLUMNS},
        COALESCE(mc.label, ma.milestone_key) AS "milestoneLabel",
        u.first_name AS "employeeFirstName",
        u.last_name AS "employeeLastName"
      FROM milestone_actions ma
      LEFT JOIN milestone_configs mc ON mc.milestone_key = ma.milestone_key
        AND (mc.organisation_id = ma.organisation_id OR mc.organisation_id IS NULL)
      LEFT JOIN sickness_cases sc ON sc.id = ma.sickness_case_id
      LEFT JOIN employees e ON e.id = sc.employee_id
      LEFT JOIN users u ON u.id = e.user_id
      WHERE ma.sickness_case_id = $1
      ORDER BY ma.due_date ASC`,
      [sicknessCaseId],
    );

    return result.rows;
  }

  /**
   * Find a single milestone action by ID.
   */
  static async findById(id: string, client?: PoolClient): Promise<MilestoneAction | null> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${MilestoneActionRepository.SELECT_COLUMNS}
      FROM milestone_actions ma
      WHERE ma.id = $1`,
      [id],
    );

    return result.rows[0] || null;
  }

  /**
   * Create a single milestone action.
   */
  static async create(
    data: {
      organisationId: string;
      sicknessCaseId: string;
      milestoneKey: string;
      actionType: string;
      status: string;
      dueDate: string;
    },
    client?: PoolClient,
  ): Promise<MilestoneAction> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `INSERT INTO milestone_actions (organisation_id, sickness_case_id, milestone_key, action_type, status, due_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING ${MilestoneActionRepository.RETURNING_COLUMNS}`,
      [data.organisationId, data.sicknessCaseId, data.milestoneKey, data.actionType, data.status, data.dueDate],
    );

    return result.rows[0];
  }

  /**
   * Bulk create milestone actions (used when generating all actions for a new case timeline).
   */
  static async createMany(
    actions: {
      organisationId: string;
      sicknessCaseId: string;
      milestoneKey: string;
      actionType: string;
      status: string;
      dueDate: string;
    }[],
    client?: PoolClient,
  ): Promise<MilestoneAction[]> {
    if (actions.length === 0) return [];

    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const values: (string | number)[] = [];
    const placeholders: string[] = [];

    actions.forEach((action, i) => {
      const offset = i * 6;
      placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`);
      values.push(
        action.organisationId,
        action.sicknessCaseId,
        action.milestoneKey,
        action.actionType,
        action.status,
        action.dueDate,
      );
    });

    const result = await queryFn(
      `INSERT INTO milestone_actions (organisation_id, sickness_case_id, milestone_key, action_type, status, due_date)
      VALUES ${placeholders.join(", ")}
      RETURNING ${MilestoneActionRepository.RETURNING_COLUMNS}`,
      values,
    );

    return result.rows;
  }

  /**
   * Update the status of a milestone action.
   * Sets completed_by and completed_at when status is COMPLETED.
   */
  static async updateStatus(
    id: string,
    status: string,
    completedBy?: string,
    notes?: string,
    completedAt?: string,
    client?: PoolClient,
  ): Promise<MilestoneAction> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const isCompleting = status === "COMPLETED";

    const result = await queryFn(
      `UPDATE milestone_actions
      SET status = $1,
          completed_by = ${isCompleting ? "$3" : "completed_by"},
          completed_at = ${isCompleting ? "COALESCE($5::timestamptz, now())" : "completed_at"},
          notes = COALESCE($4, notes),
          updated_at = now()
      WHERE id = $2
      RETURNING ${MilestoneActionRepository.RETURNING_COLUMNS}`,
      [status, id, completedBy ?? null, notes ?? null, completedAt ?? null],
    );

    return result.rows[0];
  }

  /**
   * Reset a completed milestone action back to PENDING.
   * Clears completed_by, completed_at, and notes.
   */
  static async resetToPending(id: string, client?: PoolClient): Promise<MilestoneAction> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);

    const result = await queryFn(
      `UPDATE milestone_actions
      SET status = 'PENDING',
          completed_by = NULL,
          completed_at = NULL,
          notes = NULL,
          updated_at = now()
      WHERE id = $1
      RETURNING ${MilestoneActionRepository.RETURNING_COLUMNS}`,
      [id],
    );

    return result.rows[0];
  }

  /**
   * Find all overdue milestone actions for an organisation.
   * Overdue = status is PENDING and due_date is in the past.
   */
  static async findOverdue(organisationId: string, client?: PoolClient): Promise<MilestoneAction[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${MilestoneActionRepository.SELECT_COLUMNS}
      FROM milestone_actions ma
      WHERE ma.organisation_id = $1 AND ma.status = 'PENDING' AND ma.due_date < CURRENT_DATE
      ORDER BY ma.due_date ASC`,
      [organisationId],
    );

    return result.rows;
  }

  /**
   * Find outstanding (PENDING / IN_PROGRESS) milestone actions across an organisation,
   * with employee name, milestone label, and case ID for dashboard display.
   */
  static async findOutstandingWithDetails(
    organisationId: string,
    client?: PoolClient,
  ): Promise<(MilestoneActionWithDetails & { caseId: string })[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${MilestoneActionRepository.SELECT_COLUMNS},
        COALESCE(mc.label, ma.milestone_key) AS "milestoneLabel",
        u.first_name AS "employeeFirstName",
        u.last_name AS "employeeLastName",
        sc.id AS "caseId"
      FROM milestone_actions ma
      LEFT JOIN milestone_configs mc ON mc.milestone_key = ma.milestone_key
        AND (mc.organisation_id = ma.organisation_id OR mc.organisation_id IS NULL)
      LEFT JOIN sickness_cases sc ON sc.id = ma.sickness_case_id
      LEFT JOIN employees e ON e.id = sc.employee_id
      LEFT JOIN users u ON u.id = e.user_id
      WHERE ma.organisation_id = $1 AND ma.status IN ('PENDING', 'IN_PROGRESS')
        AND ma.due_date <= CURRENT_DATE
      ORDER BY ma.due_date ASC`,
      [organisationId],
    );

    return result.rows as (MilestoneActionWithDetails & { caseId: string })[];
  }

  /**
   * Find milestone actions by organisation and status (for compliance queries).
   */
  static async findByOrgAndStatus(
    organisationId: string,
    status: string,
    client?: PoolClient,
  ): Promise<MilestoneAction[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${MilestoneActionRepository.SELECT_COLUMNS}
      FROM milestone_actions ma
      WHERE ma.organisation_id = $1 AND ma.status = $2
      ORDER BY ma.due_date ASC`,
      [organisationId, status],
    );

    return result.rows;
  }
}
