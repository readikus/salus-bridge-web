import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE sickness_cases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      reported_by UUID NOT NULL REFERENCES users(id),
      status VARCHAR(30) NOT NULL DEFAULT 'REPORTED',
      absence_type VARCHAR(50) NOT NULL,
      absence_start_date DATE NOT NULL,
      absence_end_date DATE,
      working_days_lost INTEGER,
      notes_encrypted TEXT,
      is_long_term BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  await knex.raw("CREATE INDEX idx_sickness_cases_org ON sickness_cases(organisation_id)");
  await knex.raw("CREATE INDEX idx_sickness_cases_employee ON sickness_cases(employee_id)");
  await knex.raw("CREATE INDEX idx_sickness_cases_status ON sickness_cases(status)");

  await knex.raw(`
    CREATE TABLE case_transitions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sickness_case_id UUID NOT NULL REFERENCES sickness_cases(id) ON DELETE CASCADE,
      from_status VARCHAR(30),
      to_status VARCHAR(30) NOT NULL,
      action VARCHAR(50) NOT NULL,
      performed_by UUID NOT NULL REFERENCES users(id),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  await knex.raw("CREATE INDEX idx_case_transitions_case ON case_transitions(sickness_case_id)");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DROP TABLE IF EXISTS case_transitions");
  await knex.raw("DROP TABLE IF EXISTS sickness_cases");
}
