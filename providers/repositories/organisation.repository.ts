import { pool } from "@/providers/database/pool";
import { Organisation } from "@/types/database";
import { OrganisationStatus } from "@/types/enums";

export interface CreateOrgParams {
  name: string;
  slug: string;
  settings?: Record<string, unknown>;
}

export interface UpdateOrgParams {
  name?: string;
  slug?: string;
  status?: OrganisationStatus;
  settings?: Record<string, unknown>;
}

export interface OrgStats {
  employeeCount: number;
  activeEmployeeCount: number;
  departmentCount: number;
}

const SELECT_FIELDS = `
  id,
  name,
  slug,
  status,
  settings,
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export class OrganisationRepository {
  /**
   * Find all organisations (platform admin list - PLAT-03).
   * Does NOT go through TenantService (platform admin sees all orgs).
   */
  static async findAll(): Promise<Organisation[]> {
    const result = await pool.query(
      `SELECT ${SELECT_FIELDS} FROM organisations ORDER BY name ASC`,
    );
    return result.rows;
  }

  /**
   * Find an organisation by internal ID.
   */
  static async findById(id: string): Promise<Organisation | null> {
    const result = await pool.query(
      `SELECT ${SELECT_FIELDS} FROM organisations WHERE id = $1`,
      [id],
    );
    return result.rows[0] || null;
  }

  /**
   * Find an organisation by slug.
   */
  static async findBySlug(slug: string): Promise<Organisation | null> {
    const result = await pool.query(
      `SELECT ${SELECT_FIELDS} FROM organisations WHERE slug = $1`,
      [slug],
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new organisation.
   */
  static async create(params: CreateOrgParams): Promise<Organisation> {
    const result = await pool.query(
      `INSERT INTO organisations (name, slug, settings)
      VALUES ($1, $2, $3)
      RETURNING ${SELECT_FIELDS}`,
      [params.name, params.slug, JSON.stringify(params.settings || {})],
    );
    return result.rows[0];
  }

  /**
   * Update an existing organisation.
   */
  static async update(id: string, params: UpdateOrgParams): Promise<Organisation> {
    const setClauses: string[] = [];
    const values: (string | null)[] = [];
    let paramIndex = 1;

    if (params.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(params.name);
    }
    if (params.slug !== undefined) {
      setClauses.push(`slug = $${paramIndex++}`);
      values.push(params.slug);
    }
    if (params.status !== undefined) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(params.status);
    }
    if (params.settings !== undefined) {
      setClauses.push(`settings = $${paramIndex++}`);
      values.push(JSON.stringify(params.settings));
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE organisations
      SET ${setClauses.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING ${SELECT_FIELDS}`,
      values,
    );

    return result.rows[0];
  }

  /**
   * Get organisation statistics (for dashboard - ORG-04).
   * Returns employee count, active employee count, and department count.
   */
  static async getStats(id: string): Promise<OrgStats> {
    const result = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM employees WHERE organisation_id = $1)::int AS "employeeCount",
        (SELECT COUNT(*) FROM employees WHERE organisation_id = $1 AND status = 'ACTIVE')::int AS "activeEmployeeCount",
        (SELECT COUNT(*) FROM departments WHERE organisation_id = $1)::int AS "departmentCount"`,
      [id],
    );
    return result.rows[0];
  }
}
