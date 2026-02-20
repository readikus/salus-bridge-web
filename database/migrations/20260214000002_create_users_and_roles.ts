import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Create users table
  await knex.raw(`
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      supabase_auth_id VARCHAR(255) UNIQUE,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  await knex.raw("CREATE INDEX idx_users_email ON users(email)");
  await knex.raw("CREATE INDEX idx_users_supabase_auth_id ON users(supabase_auth_id)");

  // Create user_roles table
  await knex.raw(`
    CREATE TABLE user_roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(user_id, organisation_id, role)
    )
  `);

  await knex.raw("CREATE INDEX idx_user_roles_user_org ON user_roles(user_id, organisation_id)");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DROP TABLE IF EXISTS user_roles");
  await knex.raw("DROP TABLE IF EXISTS users");
}
