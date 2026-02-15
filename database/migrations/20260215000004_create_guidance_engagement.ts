import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE guidance_engagement (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      sickness_case_id UUID NOT NULL REFERENCES sickness_cases(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id),
      guidance_type VARCHAR(50) NOT NULL,
      guidance_step VARCHAR(100) NOT NULL,
      engaged_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  await knex.raw("CREATE INDEX idx_guidance_case ON guidance_engagement(sickness_case_id)");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DROP TABLE IF EXISTS guidance_engagement");
}
