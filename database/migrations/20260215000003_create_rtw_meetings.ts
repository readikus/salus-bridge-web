import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE rtw_meetings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      sickness_case_id UUID NOT NULL REFERENCES sickness_cases(id) ON DELETE CASCADE,
      employee_id UUID NOT NULL REFERENCES employees(id),
      scheduled_by UUID NOT NULL REFERENCES users(id),
      scheduled_date TIMESTAMPTZ NOT NULL,
      completed_date TIMESTAMPTZ,
      status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
      questionnaire_responses JSONB,
      outcomes_encrypted TEXT,
      adjustments JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DROP TABLE IF EXISTS rtw_meetings");
}
