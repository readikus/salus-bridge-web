import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE employees (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
      organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
      department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
      manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
      job_title VARCHAR(255),
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      invitation_token VARCHAR(255) UNIQUE,
      invitation_expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  await knex.raw("CREATE INDEX idx_employees_organisation_id ON employees(organisation_id)");
  await knex.raw("CREATE INDEX idx_employees_user_id ON employees(user_id)");
  await knex.raw("CREATE INDEX idx_employees_manager_id ON employees(manager_id)");
  await knex.raw("CREATE INDEX idx_employees_invitation_token ON employees(invitation_token)");
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw("DROP TABLE IF EXISTS employees");
}
