import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE fit_notes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      sickness_case_id UUID NOT NULL REFERENCES sickness_cases(id) ON DELETE CASCADE,
      employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      uploaded_by UUID NOT NULL REFERENCES users(id),
      storage_path TEXT NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_size_bytes INTEGER,
      content_type VARCHAR(100),
      fit_note_status VARCHAR(20) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE,
      functional_effects JSONB DEFAULT '[]',
      notes_encrypted TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  await knex.raw("CREATE INDEX idx_fit_notes_case ON fit_notes(sickness_case_id)");
  await knex.raw("CREATE INDEX idx_fit_notes_expiry ON fit_notes(end_date) WHERE end_date IS NOT NULL");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DROP TABLE IF EXISTS fit_notes");
}
