/**
 * Bootstrap the first super admin user.
 *
 * Usage:
 *   dotenv -e .env.local -- npx ts-node scripts/seed-admin.ts <email> <password>
 *
 * This creates both a Supabase Auth user and a local DB user, so you can
 * log in immediately at /login.
 */

import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: seed-admin.ts <email> <password>");
  process.exit(1);
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  if (!supabaseUrl || !serviceRoleKey || !databaseUrl) {
    console.error("Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL");
    process.exit(1);
  }

  // 1. Create Supabase Auth user
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Creating Supabase Auth user for ${email}...`);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let supabaseAuthId: string;

  if (authError) {
    if (authError.message?.includes("already been registered")) {
      console.log("User already exists in Supabase Auth, looking up ID...");
      const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const existing = listData?.users?.find((u: { email?: string }) => u.email === email);
      if (!existing) {
        console.error("Could not find existing user");
        process.exit(1);
      }
      supabaseAuthId = existing.id;
    } else {
      console.error("Failed to create auth user:", authError.message);
      process.exit(1);
    }
  } else {
    supabaseAuthId = authData.user.id;
  }

  console.log(`Supabase Auth ID: ${supabaseAuthId}`);

  // 2. Create local DB user
  const db = new Client({ connectionString: databaseUrl });
  await db.connect();

  try {
    const existing = await db.query("SELECT id FROM users WHERE email = $1", [email]);

    if (existing.rows.length > 0) {
      console.log("User already exists in local DB, updating supabase_auth_id...");
      await db.query("UPDATE users SET supabase_auth_id = $1 WHERE email = $2", [supabaseAuthId, email]);
    } else {
      console.log("Creating local DB user...");
      await db.query(
        "INSERT INTO users (email, supabase_auth_id, first_name, last_name) VALUES ($1, $2, $3, $4)",
        [email, supabaseAuthId, "Admin", "User"],
      );
    }

    console.log("Done! You can now log in at /login");
    console.log(`\nIMPORTANT: Add "${email}" to SUPER_ADMIN_EMAILS in constants/roles.ts`);
  } finally {
    await db.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
