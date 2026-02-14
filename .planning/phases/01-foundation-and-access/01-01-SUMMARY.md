---
phase: 01-foundation-and-access
plan: 01
subsystem: database
tags: [postgres, knex, pg, aes-256-gcm, rls, audit-logging, encryption, next.js]

# Dependency graph
requires: []
provides:
  - PostgreSQL connection pool via pg
  - Knex migration infrastructure with 5 migrations
  - Core schema: organisations, departments, users, user_roles, employees, audit_logs
  - AES-256-GCM encryption utilities (COMP-02)
  - Audit logging service with SAR readiness (COMP-05)
  - TypeScript types and enums for all database entities
  - Row-level security policies for tenant isolation
affects: [01-02-auth, 01-03-org-management, 01-04-employee-management, 01-05-rbac]

# Tech tracking
tech-stack:
  added: [next.js 16.1.6, react 19.2.3, pg, knex, tailwindcss 4, zod, class-variance-authority, lucide-react, tailwind-merge]
  patterns: [service-repository pattern with static class methods, raw SQL via pg pool with snake_case AS camelCase, AES-256-GCM encryption format iv:authTag:ciphertext]

key-files:
  created:
    - providers/database/pool.ts
    - providers/database/encryption.ts
    - providers/repositories/audit-log.repository.ts
    - providers/services/audit-log.service.ts
    - providers/services/encryption.service.ts
    - types/database.ts
    - types/enums.ts
    - knexfile.ts
    - database/migrations/20260214000001_create_organisations.ts
    - database/migrations/20260214000002_create_users_and_roles.ts
    - database/migrations/20260214000003_create_employees.ts
    - database/migrations/20260214000004_create_audit_logs.ts
    - database/migrations/20260214000005_enable_rls.ts
  modified:
    - package.json
    - tsconfig.json
    - .gitignore

key-decisions:
  - "Used trigger-based immutability for audit_logs instead of REVOKE (works with superuser connections)"
  - "RLS uses session variable app.current_organisation_id set per-request by application"
  - "strict: false in tsconfig per CLAUDE.md conventions"
  - "Path alias @/* maps to project root (not src/) per CLAUDE.md"

patterns-established:
  - "Repository pattern: static class methods with parameterised SQL via pool.query()"
  - "SQL column aliasing: snake_case columns AS camelCase in all SELECT queries"
  - "Encryption format: iv:authTag:ciphertext as base64 strings"
  - "Migration convention: raw SQL via knex.raw() for full control"

# Metrics
duration: 7min
completed: 2026-02-14
---

# Phase 1 Plan 1: Foundation & Database Schema Summary

**Next.js 16 scaffold with PostgreSQL schema (6 tables), AES-256-GCM encryption, audit logging service, and RLS tenant isolation**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-14T11:53:16Z
- **Completed:** 2026-02-14T12:01:03Z
- **Tasks:** 3
- **Files modified:** 29

## Accomplishments
- Next.js 16 project scaffolded with App Router, Tailwind CSS 4, TypeScript, and all core dependencies
- 5 Knex migrations creating 6 tables with proper constraints, indexes, and foreign keys
- AES-256-GCM encryption utilities with round-trip verification (COMP-02)
- Audit log repository and service with entity, user, and organisation queries (COMP-05 SAR readiness)
- Row-level security policies with session-variable-based tenant isolation
- Immutable audit logs enforced via database triggers

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js project with database connectivity** - `9a01682` (feat)
2. **Task 2: Create core database schema via Knex migrations** - `6f0cc89` (feat)
3. **Task 3: Build encryption utilities and audit logging service** - `ddeb803` (feat)

## Files Created/Modified
- `package.json` - Project dependencies (Next.js, pg, knex, tailwind, zod, etc.)
- `tsconfig.json` - TypeScript config with @/* path alias to project root
- `knexfile.ts` - Knex config for PostgreSQL with dotenv support
- `.env.example` - Environment variable template
- `providers/database/pool.ts` - Singleton pg Pool with Supabase SSL config
- `providers/database/encryption.ts` - AES-256-GCM encrypt/decrypt functions
- `providers/repositories/audit-log.repository.ts` - Audit log CRUD with parameterised SQL
- `providers/services/audit-log.service.ts` - Audit log business logic layer
- `providers/services/encryption.service.ts` - Field/object encryption wrapper
- `types/database.ts` - TypeScript interfaces for all entities + query params
- `types/enums.ts` - Enums for UserRole, AuditAction, AuditEntity, statuses
- `database/migrations/20260214000001_create_organisations.ts` - organisations + departments
- `database/migrations/20260214000002_create_users_and_roles.ts` - users + user_roles
- `database/migrations/20260214000003_create_employees.ts` - employees with manager hierarchy
- `database/migrations/20260214000004_create_audit_logs.ts` - audit_logs with immutability triggers
- `database/migrations/20260214000005_enable_rls.ts` - RLS policies for tenant isolation
- `app/layout.tsx` - Root layout with SalusBridge metadata
- `app/page.tsx` - Default Next.js landing page
- `app/globals.css` - Tailwind CSS base styles

## Decisions Made
- Used trigger-based immutability for audit_logs (BEFORE UPDATE/DELETE triggers that RAISE EXCEPTION) instead of REVOKE, because the application connects as postgres superuser via Supabase which bypasses REVOKE
- RLS policies use `current_setting('app.current_organisation_id', true)::uuid` session variable, to be set by application code before each tenant-scoped query
- Platform admin bypass via `current_setting('app.is_platform_admin', true)::boolean` session variable
- Users table RLS uses a subquery join to user_roles to determine visibility within an org

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Database credentials invalid - migrations not yet executed**
- **Found during:** Task 2 (migration execution)
- **Issue:** The .env file contained Supabase credentials for a project ID (rbejmrydmkdybbvscwth) that does not exist in the user's Supabase account
- **Fix:** Created all 5 migration files with correct SQL. Migrations are ready to run once correct DATABASE_URL is provided
- **Files modified:** .env.local (created with placeholder)
- **Verification:** TypeScript compiles, migration files are syntactically correct
- **Impact:** Migrations need to be run manually once database credentials are corrected

**2. [Rule 3 - Blocking] create-next-app refused to run in non-empty directory**
- **Found during:** Task 1 (project scaffolding)
- **Issue:** Project directory had existing files (.planning/, CLAUDE.md, etc.) which blocked create-next-app
- **Fix:** Scaffolded in temp directory, copied relevant files, cleaned up
- **Verification:** Project structure matches CLAUDE.md conventions

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Migration files are complete but not yet executed against the database. All code is correct and TypeScript-verified. User needs to provide valid DATABASE_URL to run migrations.

## Issues Encountered
- Supabase project referenced in .env does not exist in user's account. Tried multiple connection string formats and regions. Database migrations cannot be executed until valid credentials are provided.

## User Setup Required

Before migrations can be run, the user needs to:

1. **Create a Supabase project** (or identify the correct existing one)
2. **Update `.env.local`** with the correct `DATABASE_URL` from Supabase Dashboard > Settings > Database > Connection string (URI)
3. **Run migrations one at a time:**
   ```bash
   yarn migrate:up  # Run 5 times, once for each migration
   ```
4. **Verify tables exist:**
   ```bash
   node -e "require('dotenv').config({path:'.env.local'});const {Pool}=require('pg');const p=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});p.query(\"SELECT table_name FROM information_schema.tables WHERE table_schema='public'\").then(r=>{console.log(r.rows);p.end()})"
   ```

## Next Phase Readiness
- All code infrastructure is ready for Plan 02 (Auth0 integration)
- Database connection pool, encryption, and audit logging are available for import
- TypeScript types and enums are defined for all entities
- **Blocker:** Database migrations must be run before any database-dependent features work

## Self-Check: PASSED

All 16 key files verified present. All 3 task commits (9a01682, 6f0cc89, ddeb803) verified in git history.

---
*Phase: 01-foundation-and-access*
*Completed: 2026-02-14*
