import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Enable RLS on tenant-scoped tables
  // DO NOT enable on audit_logs (needs cross-tenant query for platform admin)
  const tables = ["organisations", "departments", "users", "user_roles", "employees"];

  for (const table of tables) {
    await knex.raw(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
  }

  // -- Organisation isolation policies --

  // Organisations: isolate by id matching session var
  await knex.raw(`
    CREATE POLICY org_isolation ON organisations
    USING (id = current_setting('app.current_organisation_id', true)::uuid)
  `);

  // Platform admin bypass for organisations
  await knex.raw(`
    CREATE POLICY platform_admin_bypass ON organisations
    USING (current_setting('app.is_platform_admin', true)::boolean = true)
  `);

  // -- Departments: isolate by organisation_id --
  await knex.raw(`
    CREATE POLICY dept_org_isolation ON departments
    USING (organisation_id = current_setting('app.current_organisation_id', true)::uuid)
  `);

  await knex.raw(`
    CREATE POLICY dept_platform_admin_bypass ON departments
    USING (current_setting('app.is_platform_admin', true)::boolean = true)
  `);

  // -- User roles: isolate by organisation_id --
  await knex.raw(`
    CREATE POLICY user_roles_org_isolation ON user_roles
    USING (organisation_id = current_setting('app.current_organisation_id', true)::uuid)
  `);

  await knex.raw(`
    CREATE POLICY user_roles_platform_admin_bypass ON user_roles
    USING (current_setting('app.is_platform_admin', true)::boolean = true)
  `);

  // -- Employees: isolate by organisation_id --
  await knex.raw(`
    CREATE POLICY employees_org_isolation ON employees
    USING (organisation_id = current_setting('app.current_organisation_id', true)::uuid)
  `);

  await knex.raw(`
    CREATE POLICY employees_platform_admin_bypass ON employees
    USING (current_setting('app.is_platform_admin', true)::boolean = true)
  `);

  // -- Users: visible if they have a role in the current org --
  await knex.raw(`
    CREATE POLICY users_org_isolation ON users
    USING (
      id IN (
        SELECT user_id FROM user_roles
        WHERE organisation_id = current_setting('app.current_organisation_id', true)::uuid
      )
    )
  `);

  await knex.raw(`
    CREATE POLICY users_platform_admin_bypass ON users
    USING (current_setting('app.is_platform_admin', true)::boolean = true)
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop all policies
  const policies = [
    { name: "users_platform_admin_bypass", table: "users" },
    { name: "users_org_isolation", table: "users" },
    { name: "employees_platform_admin_bypass", table: "employees" },
    { name: "employees_org_isolation", table: "employees" },
    { name: "user_roles_platform_admin_bypass", table: "user_roles" },
    { name: "user_roles_org_isolation", table: "user_roles" },
    { name: "dept_platform_admin_bypass", table: "departments" },
    { name: "dept_org_isolation", table: "departments" },
    { name: "platform_admin_bypass", table: "organisations" },
    { name: "org_isolation", table: "organisations" },
  ];

  for (const { name, table } of policies) {
    await knex.raw(`DROP POLICY IF EXISTS ${name} ON ${table}`);
  }

  // Disable RLS
  const tables = ["organisations", "departments", "users", "user_roles", "employees"];
  for (const table of tables) {
    await knex.raw(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY`);
  }
}
