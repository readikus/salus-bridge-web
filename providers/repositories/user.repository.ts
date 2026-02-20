import { pool } from "@/providers/database/pool";
import { User } from "@/types/database";

export interface CreateUserParams {
  email: string;
  supabaseAuthId?: string;
  firstName?: string;
  lastName?: string;
}

export interface UpdateUserParams {
  email?: string;
  supabaseAuthId?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

export class UserRepository {
  /**
   * Find a user by their internal ID.
   */
  static async findById(id: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT
        id,
        email,
        supabase_auth_id AS "supabaseAuthId",
        first_name AS "firstName",
        last_name AS "lastName",
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM users
      WHERE id = $1`,
      [id],
    );

    return result.rows[0] || null;
  }

  /**
   * Find a user by email address.
   */
  static async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT
        id,
        email,
        supabase_auth_id AS "supabaseAuthId",
        first_name AS "firstName",
        last_name AS "lastName",
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM users
      WHERE LOWER(email) = LOWER($1)`,
      [email],
    );

    return result.rows[0] || null;
  }

  /**
   * Find a user by their Supabase Auth ID.
   */
  static async findBySupabaseAuthId(supabaseAuthId: string): Promise<User | null> {
    const result = await pool.query(
      `SELECT
        id,
        email,
        supabase_auth_id AS "supabaseAuthId",
        first_name AS "firstName",
        last_name AS "lastName",
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM users
      WHERE supabase_auth_id = $1`,
      [supabaseAuthId],
    );

    return result.rows[0] || null;
  }

  /**
   * Create a new user.
   */
  static async create(params: CreateUserParams): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (email, supabase_auth_id, first_name, last_name)
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        email,
        supabase_auth_id AS "supabaseAuthId",
        first_name AS "firstName",
        last_name AS "lastName",
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      [params.email, params.supabaseAuthId || null, params.firstName || null, params.lastName || null],
    );

    return result.rows[0];
  }

  /**
   * Update an existing user.
   */
  static async update(id: string, params: UpdateUserParams): Promise<User> {
    const setClauses: string[] = [];
    const values: (string | boolean | null)[] = [];
    let paramIndex = 1;

    if (params.email !== undefined) {
      setClauses.push(`email = $${paramIndex++}`);
      values.push(params.email);
    }
    if (params.supabaseAuthId !== undefined) {
      setClauses.push(`supabase_auth_id = $${paramIndex++}`);
      values.push(params.supabaseAuthId);
    }
    if (params.firstName !== undefined) {
      setClauses.push(`first_name = $${paramIndex++}`);
      values.push(params.firstName);
    }
    if (params.lastName !== undefined) {
      setClauses.push(`last_name = $${paramIndex++}`);
      values.push(params.lastName);
    }
    if (params.isActive !== undefined) {
      setClauses.push(`is_active = $${paramIndex++}`);
      values.push(params.isActive);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE users
      SET ${setClauses.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING
        id,
        email,
        supabase_auth_id AS "supabaseAuthId",
        first_name AS "firstName",
        last_name AS "lastName",
        is_active AS "isActive",
        created_at AS "createdAt",
        updated_at AS "updatedAt"`,
      values,
    );

    return result.rows[0];
  }

  /**
   * Find all users belonging to an organisation (via user_roles JOIN).
   */
  static async findByOrganisation(organisationId: string): Promise<User[]> {
    const result = await pool.query(
      `SELECT DISTINCT
        u.id,
        u.email,
        u.supabase_auth_id AS "supabaseAuthId",
        u.first_name AS "firstName",
        u.last_name AS "lastName",
        u.is_active AS "isActive",
        u.created_at AS "createdAt",
        u.updated_at AS "updatedAt"
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.organisation_id = $1
      ORDER BY u.created_at ASC`,
      [organisationId],
    );

    return result.rows;
  }
}
