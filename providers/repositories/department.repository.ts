import { pool } from "@/providers/database/pool";
import { Department } from "@/types/database";

const SELECT_FIELDS = `
  id,
  organisation_id AS "organisationId",
  name,
  created_at AS "createdAt"
`;

export class DepartmentRepository {
  /**
   * Find all departments for an organisation.
   */
  static async findByOrganisation(organisationId: string): Promise<Department[]> {
    const result = await pool.query(
      `SELECT ${SELECT_FIELDS} FROM departments WHERE organisation_id = $1 ORDER BY name ASC`,
      [organisationId],
    );
    return result.rows;
  }

  /**
   * Create a new department.
   */
  static async create(params: { organisationId: string; name: string }): Promise<Department> {
    const result = await pool.query(
      `INSERT INTO departments (organisation_id, name)
      VALUES ($1, $2)
      RETURNING ${SELECT_FIELDS}`,
      [params.organisationId, params.name],
    );
    return result.rows[0];
  }

  /**
   * Find or create a department by name within an organisation.
   * Used during CSV import (Plan 05).
   */
  static async findOrCreate(organisationId: string, name: string): Promise<Department> {
    // Try to find existing
    const existing = await pool.query(
      `SELECT ${SELECT_FIELDS} FROM departments
      WHERE organisation_id = $1 AND LOWER(name) = LOWER($2)`,
      [organisationId, name],
    );

    if (existing.rows.length > 0) {
      return existing.rows[0];
    }

    // Create new
    const result = await pool.query(
      `INSERT INTO departments (organisation_id, name)
      VALUES ($1, $2)
      RETURNING ${SELECT_FIELDS}`,
      [organisationId, name],
    );
    return result.rows[0];
  }
}
