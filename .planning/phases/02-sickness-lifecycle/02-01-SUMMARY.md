---
phase: 02-sickness-lifecycle
plan: 01
subsystem: database
tags: [postgres, migrations, rls, zod, rbac, state-machine, enums]

# Dependency graph
requires:
  - phase: 01-foundation-and-access
    provides: "organisations, users, employees, departments tables with RLS and RBAC"
provides:
  - "sickness_cases and case_transitions tables for workflow tracking"
  - "fit_notes table for document metadata"
  - "rtw_meetings table for return-to-work scheduling"
  - "guidance_engagement table for manager guidance tracking"
  - "RLS policies on all 5 new tables"
  - "SicknessState/SicknessAction enums with VALID_TRANSITIONS map"
  - "AbsenceType enum with labels"
  - "FitNoteStatus, FunctionalEffect, RtwMeetingStatus enums"
  - "9 new RBAC permissions mapped to all 5 roles"
  - "Zod schemas for sickness case, fit note, and RTW meeting input"
affects: [02-02, 02-03, 02-04, 02-05]

# Tech tracking
tech-stack:
  added: []
  patterns: ["hand-rolled state machine via VALID_TRANSITIONS map", "RLS join-based policy for child tables without org column"]

key-files:
  created:
    - database/migrations/20260215000001_create_sickness_cases.ts
    - database/migrations/20260215000002_create_fit_notes.ts
    - database/migrations/20260215000003_create_rtw_meetings.ts
    - database/migrations/20260215000004_create_guidance_engagement.ts
    - database/migrations/20260215000005_enable_rls_phase2.ts
    - constants/absence-types.ts
    - constants/sickness-states.ts
    - schemas/sickness-case.ts
    - schemas/fit-note.ts
    - schemas/rtw-meeting.ts
  modified:
    - types/enums.ts
    - types/database.ts
    - constants/permissions.ts

key-decisions:
  - "case_transitions uses join-based RLS policy (no direct organisation_id column) to avoid denormalization"
  - "Hand-rolled state machine: VALID_TRANSITIONS Record rather than xstate library"
  - "9 new permissions with HR/ORG_ADMIN getting full sickness access, EMPLOYEE limited to own-only enforced at API level"

patterns-established:
  - "State machine as Record<State, Partial<Record<Action, State>>> for deterministic transitions"
  - "Phase 2 RLS follows Phase 1 pattern: org_isolation + platform_admin_bypass per table"

# Metrics
duration: 3min
completed: 2026-02-15
---

# Phase 2 Plan 1: Schema & Types Summary

**5 database migrations (sickness_cases, case_transitions, fit_notes, rtw_meetings, guidance_engagement) with RLS, state machine constants, 9 RBAC permissions, and Zod validation schemas**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-15T22:10:13Z
- **Completed:** 2026-02-15T22:12:51Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- 5 Phase 2 database tables with correct columns, foreign keys, and indexes
- RLS policies on all new tables matching Phase 1 pattern (org isolation + platform admin bypass)
- Complete type system: SicknessState/Action enums, VALID_TRANSITIONS map, AbsenceType, FitNoteStatus, FunctionalEffect, RtwMeetingStatus
- 5 new database interfaces in types/database.ts
- 9 new permissions mapped across all 5 roles with appropriate access levels
- 3 Zod validation schemas for sickness case, fit note, and RTW meeting creation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create database migrations for all Phase 2 tables** - `c1309e4` (feat)
2. **Task 2: Create constants, types, enums, permissions, and Zod schemas** - `4a71a57` (feat)

## Files Created/Modified
- `database/migrations/20260215000001_create_sickness_cases.ts` - sickness_cases + case_transitions tables
- `database/migrations/20260215000002_create_fit_notes.ts` - fit_notes table with partial expiry index
- `database/migrations/20260215000003_create_rtw_meetings.ts` - rtw_meetings table
- `database/migrations/20260215000004_create_guidance_engagement.ts` - guidance_engagement table
- `database/migrations/20260215000005_enable_rls_phase2.ts` - RLS policies for all Phase 2 tables
- `constants/absence-types.ts` - AbsenceType enum and human-readable labels
- `constants/sickness-states.ts` - SicknessState, SicknessAction, VALID_TRANSITIONS, FitNoteStatus, FunctionalEffect, RtwMeetingStatus
- `types/enums.ts` - Added TRANSITION/UPLOAD/DOWNLOAD/SCHEDULE/SEND to AuditAction, SICKNESS_CASE/FIT_NOTE/RTW_MEETING/GUIDANCE/NOTIFICATION to AuditEntity
- `types/database.ts` - Added SicknessCase, CaseTransition, FitNote, RtwMeeting, GuidanceEngagement interfaces
- `constants/permissions.ts` - 9 new permissions with role mappings
- `schemas/sickness-case.ts` - Zod schema for creating sickness cases
- `schemas/fit-note.ts` - Zod schema for fit note metadata
- `schemas/rtw-meeting.ts` - Zod schema for RTW meeting creation

## Decisions Made
- case_transitions uses a join-based RLS policy (subquery into sickness_cases) rather than adding a redundant organisation_id column -- keeps data normalized while maintaining tenant isolation
- Hand-rolled state machine via VALID_TRANSITIONS Record rather than xstate library -- simpler, no dependencies, fits existing service/repository pattern
- EMPLOYEE role gets REPORT_SICKNESS, VIEW_SICKNESS_CASES, VIEW_FIT_NOTES (own-only enforcement deferred to API layer)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required. Migrations must be run against the database with `npx knex migrate:up` (5 times for each migration).

## Next Phase Readiness
- All Phase 2 tables and types ready for service/repository implementation (Plan 02)
- State machine constants ready for WorkflowService (Plan 02)
- Permissions ready for API route authorization (Plan 03)
- Zod schemas ready for API input validation (Plan 03)

## Self-Check: PASSED

- All 10 created files verified on disk
- Both task commits (c1309e4, 4a71a57) verified in git log
- TypeScript compiles cleanly with `npx tsc --noEmit`

---
*Phase: 02-sickness-lifecycle*
*Completed: 2026-02-15*
