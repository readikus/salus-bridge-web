import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE waitlist (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DROP TABLE IF EXISTS waitlist");
}
