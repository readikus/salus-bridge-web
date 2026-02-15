# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-14)

**Core value:** An employee can report sickness and be guided through a complete return-to-work cycle -- with their manager receiving structured, empathetic guidance at every step.
**Current focus:** Phase 2 - Sickness Lifecycle

## Current Position

Phase: 2 of 3 (Sickness Lifecycle)
Plan: 5 of 5 in current phase
Status: Phase 2 Complete
Last activity: 2026-02-15 -- Completed 02-05 (Notifications, Calendar & Dashboard)

Progress: [█████████████░] 66%

## Performance Metrics

**Velocity:**
- Total plans completed: 10
- Average duration: 10min
- Total execution time: 1.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-and-access | 5/5 | 33min | 7min |
| 02-sickness-lifecycle | 5/5 | 76min | 15min |

**Recent Trend:**
- Last 5 plans: 02-01 (3min), 02-02 (6min), 02-03 (5min), 02-04 (40min), 02-05 (22min)
- Trend: Phase 2 complete, 02-05 included SendGrid setup + calendar UI

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
- case_transitions uses join-based RLS policy (no direct organisation_id) to avoid denormalization
- Hand-rolled state machine via VALID_TRANSITIONS Record rather than xstate library
- 9 new RBAC permissions: EMPLOYEE gets own-only sickness access, HR/ORG_ADMIN get full sickness access
- GOV.UK bank holidays API with 24h cache and static 2026 fallback for working day calculation
- WorkflowService as single entry point for all state transitions (wraps TenantService.withTenant)
- Long-term threshold checked on every transition using org settings absenceTriggerThresholds.longTermDays
- ACKNOWLEDGE action allowed for EMPLOYEE role; other transitions require MANAGE_SICKNESS_CASES
- Supabase Storage private bucket with 5-minute signed URLs for secure fit note document access
- FIT-04 manager exclusion enforced at service layer via assertNotManager() (not just permission layer)
- Cron endpoint (/api/cron/fit-note-expiry) uses CRON_SECRET bearer token, not user auth
- Storage cleanup on failure: uploaded file deleted from Supabase if DB record creation fails
- 5 guidance scripts: initial_contact (mental_health, musculoskeletal, general), check_in (general), rtw_meeting (general) with general fallback
- Guidance type mapped from case state: REPORTED/TRACKING -> initial_contact, FIT_NOTE_RECEIVED -> check_in, RTW_SCHEDULED+ -> rtw_meeting
- RTW outcomes encrypted; questionnaire responses stored as JSONB (non-diagnostic, structured)
- RTW meeting cancellation does not trigger state transition (allows rescheduling)
- No notification repository; sends logged via AuditLogService with AuditEntity.NOTIFICATION
- Fire-and-forget notifications: failures caught and logged, never block workflow transitions
- Calendar shows first name + last initial for privacy (not full employee names)
- CSS grid calendar with Tailwind (no external calendar library)
- Date range filtering uses overlap logic for calendar month queries

### Pending Todos

None yet.

### Blockers/Concerns

- DPIA (Data Protection Impact Assessment) should be completed before Phase 2 health data work begins
- Library versions from research need verification against npm before install (recharts, etc.) -- date-fns@4.1.0 installed
- DATABASE_URL: Supabase project in .env (rbejmrydmkdybbvscwth) does not exist. User must provide valid DATABASE_URL and run migrations
- AUTH0: Auth0 application credentials (AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET) must be configured in .env.local
- AUTH0 Management API: AUTH0_MANAGEMENT_CLIENT_ID and AUTH0_MANAGEMENT_CLIENT_SECRET needed for invitation password setup

## Session Continuity

Last session: 2026-02-15
Stopped at: Completed 02-05-PLAN.md (Phase 2 complete)
Resume file: .planning/phases/02-sickness-lifecycle/02-05-SUMMARY.md
