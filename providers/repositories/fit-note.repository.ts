import { pool } from "@/providers/database/pool";
import { FitNote } from "@/types/database";
import { PoolClient } from "pg";

export interface ExpiringFitNote extends FitNote {
  employeeName: string;
  caseStatus: string;
}

/**
 * Fit note repository -- CRUD operations for fit notes.
 * All queries use parameterised SQL with snake_case columns aliased to camelCase.
 */
export class FitNoteRepository {
  private static readonly SELECT_COLUMNS = `
    fn.id,
    fn.organisation_id AS "organisationId",
    fn.sickness_case_id AS "sicknessCaseId",
    fn.employee_id AS "employeeId",
    fn.uploaded_by AS "uploadedBy",
    fn.storage_path AS "storagePath",
    fn.file_name AS "fileName",
    fn.file_size_bytes AS "fileSizeBytes",
    fn.content_type AS "contentType",
    fn.fit_note_status AS "fitNoteStatus",
    fn.start_date AS "startDate",
    fn.end_date AS "endDate",
    fn.functional_effects AS "functionalEffects",
    fn.notes_encrypted AS "notesEncrypted",
    fn.created_at AS "createdAt"
  `;

  private static readonly RETURNING_COLUMNS = `
    id,
    organisation_id AS "organisationId",
    sickness_case_id AS "sicknessCaseId",
    employee_id AS "employeeId",
    uploaded_by AS "uploadedBy",
    storage_path AS "storagePath",
    file_name AS "fileName",
    file_size_bytes AS "fileSizeBytes",
    content_type AS "contentType",
    fit_note_status AS "fitNoteStatus",
    start_date AS "startDate",
    end_date AS "endDate",
    functional_effects AS "functionalEffects",
    notes_encrypted AS "notesEncrypted",
    created_at AS "createdAt"
  `;

  /**
   * Create a new fit note record.
   */
  static async create(
    data: {
      organisationId: string;
      sicknessCaseId: string;
      employeeId: string;
      uploadedBy: string;
      storagePath: string;
      fileName: string;
      fileSizeBytes: number;
      contentType: string;
      fitNoteStatus: string;
      startDate: string;
      endDate?: string;
      functionalEffects: string[];
      notesEncrypted?: string;
    },
    client?: PoolClient,
  ): Promise<FitNote> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `INSERT INTO fit_notes (
        organisation_id, sickness_case_id, employee_id, uploaded_by,
        storage_path, file_name, file_size_bytes, content_type,
        fit_note_status, start_date, end_date, functional_effects, notes_encrypted
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING ${FitNoteRepository.RETURNING_COLUMNS}`,
      [
        data.organisationId,
        data.sicknessCaseId,
        data.employeeId,
        data.uploadedBy,
        data.storagePath,
        data.fileName,
        data.fileSizeBytes,
        data.contentType,
        data.fitNoteStatus,
        data.startDate,
        data.endDate || null,
        JSON.stringify(data.functionalEffects),
        data.notesEncrypted || null,
      ],
    );

    return result.rows[0];
  }

  /**
   * Find a fit note by ID.
   */
  static async findById(id: string, client?: PoolClient): Promise<FitNote | null> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${FitNoteRepository.SELECT_COLUMNS}
      FROM fit_notes fn
      WHERE fn.id = $1`,
      [id],
    );

    return result.rows[0] || null;
  }

  /**
   * Find all fit notes for a sickness case, ordered by most recent first.
   */
  static async findByCaseId(caseId: string, client?: PoolClient): Promise<FitNote[]> {
    const queryFn = client ? client.query.bind(client) : pool.query.bind(pool);
    const result = await queryFn(
      `SELECT ${FitNoteRepository.SELECT_COLUMNS}
      FROM fit_notes fn
      WHERE fn.sickness_case_id = $1
      ORDER BY fn.created_at DESC`,
      [caseId],
    );

    return result.rows;
  }

  /**
   * Find fit notes expiring within a given number of days.
   * Joins employees and sickness_cases for context.
   */
  static async findExpiringWithinDays(days: number): Promise<ExpiringFitNote[]> {
    const result = await pool.query(
      `SELECT ${FitNoteRepository.SELECT_COLUMNS},
        CONCAT(u.first_name, ' ', u.last_name) AS "employeeName",
        sc.status AS "caseStatus"
      FROM fit_notes fn
      JOIN employees e ON fn.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      JOIN sickness_cases sc ON fn.sickness_case_id = sc.id
      WHERE fn.end_date IS NOT NULL
        AND fn.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + make_interval(days => $1)
        AND sc.status NOT IN ('CLOSED')
      ORDER BY fn.end_date ASC`,
      [days],
    );

    return result.rows;
  }
}
