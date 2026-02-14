# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-14)

**Core value:** An employee can report sickness and be guided through a complete return-to-work cycle -- with their manager receiving structured, empathetic guidance at every step.
**Current focus:** Phase 1 - Foundation & Access

## Current Position

Phase: 1 of 3 (Foundation & Access)
Plan: 5 of 5 in current phase
Status: Phase Complete
Last activity: 2026-02-14 -- Completed 01-05 (CSV Import & SAR Data)

Progress: [███████░░░] 33%

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 7min
- Total execution time: 0.6 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-and-access | 5/5 | 33min | 7min |

**Recent Trend:**
- Last 5 plans: 01-01 (7min), 01-02 (7min), 01-04 (7min), 01-03 (8min), 01-05 (5min)
- Trend: Consistent

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Compliance-first build order: audit logging, encryption, and RBAC must exist before any health data flows
- Quick depth (3 phases): aggressive grouping to ship MVP fast
- Trigger-based audit log immutability (instead of REVOKE) for Supabase superuser connections
- RLS via session variables (app.current_organisation_id) set per-request
- Auth0 SDK v4 uses middleware-based route handling at /auth/* (not v3 handleAuth pattern)
- TenantService.withTenant() wraps all org-scoped queries with RLS context
- Custom /api/auth/me endpoint for client-side session hydration (Auth0 profile lacks local roles)
- Organisation list uses server-side data fetching with client TanStack Table for sorting/pagination
- Platform admin dashboard redirects to /organisations rather than rendering inline
- Employee dashboard shows 4 cards (Profile, Absences, Documents, Wellbeing) to feel like a real product
- Recursive CTE for manager reporting chain (full hierarchy, not just direct reports)
- Department auto-created if name doesn't exist when creating employee
- Role assignment integrated into PATCH /api/employees/[id] via roles array
- papaparse for CSV parsing (handles quoted fields, edge cases)
- Two-pass import: create employees first, then link managers (handles forward references)
- SAR data includes audit entries both about and by the employee
- CSV import wizard uses single-page step flow

### Pending Todos

None yet.

### Blockers/Concerns

- DPIA (Data Protection Impact Assessment) should be completed before Phase 2 health data work begins
- Library versions from research need verification against npm before install (date-fns, recharts, etc.)
- DATABASE_URL: Supabase project in .env (rbejmrydmkdybbvscwth) does not exist. User must provide valid DATABASE_URL and run migrations
- AUTH0: Auth0 application credentials (AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET) must be configured in .env.local
- AUTH0 Management API: AUTH0_MANAGEMENT_CLIENT_ID and AUTH0_MANAGEMENT_CLIENT_SECRET needed for invitation password setup

## Session Continuity

Last session: 2026-02-14
Stopped at: Completed 01-05-PLAN.md (Phase 1 complete)
Resume file: .planning/phases/01-foundation-and-access/01-05-SUMMARY.md
