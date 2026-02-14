import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Enable required extensions
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  // Create organisations table
  await knex.raw(`
    CREATE TABLE organisations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      settings JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  // Create departments table
  await knex.raw(`
    CREATE TABLE departments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(organisation_id, name)
    )
  `);

  // Index on departments organisation_id for FK lookups
  await knex.raw("CREATE INDEX idx_departments_organisation_id ON departments(organisation_id)");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DROP TABLE IF EXISTS departments");
  await knex.raw("DROP TABLE IF EXISTS organisations");
}
