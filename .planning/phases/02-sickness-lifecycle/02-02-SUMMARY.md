---
phase: 02-sickness-lifecycle
plan: 02
subsystem: api
tags: [sickness, state-machine, workflow, date-fns, bank-holidays, tanstack-table, rbac]

# Dependency graph
requires:
  - phase: 02-sickness-lifecycle/01
    provides: "sickness_cases and case_transitions tables, SicknessState/SicknessAction enums, VALID_TRANSITIONS, Zod schemas, RBAC permissions"
  - phase: 01-foundation-and-access
    provides: "TenantService, AuditLogService, EncryptionService, EmployeeRepository with recursive CTE, auth helpers"
provides:
  - "SicknessCaseRepository and CaseTransitionRepository for sickness case CRUD"
  - "WorkflowService for state machine transition validation and execution"
  - "WorkingDaysService for UK bank holiday and working day calculation"
  - "SicknessCaseService for business logic orchestration with encryption and audit"
  - "API routes: GET/POST /api/sickness-cases, GET/PATCH /api/sickness-cases/[id], POST /api/sickness-cases/[id]/transition"
  - "Client action wrappers in actions/sickness-cases.ts"
  - "Sickness report form, case detail with timeline, absence history table UI"
  - "Sidebar navigation links for Report Sickness and Absence History"
affects: [02-03, 02-04, 02-05]

# Tech tracking
tech-stack:
  added: [date-fns@4.1.0]
  patterns: ["GOV.UK bank holidays API with 24h in-memory cache and static fallback", "WorkflowService as single entry point for all state transitions", "Role-based API filtering (employee own, manager team, HR all)"]

key-files:
  created:
    - providers/repositories/sickness-case.repository.ts
    - providers/repositories/case-transition.repository.ts
    - providers/services/sickness-case.service.ts
    - providers/services/workflow.service.ts
    - providers/services/working-days.service.ts
    - app/api/sickness-cases/route.ts
    - app/api/sickness-cases/[id]/route.ts
    - app/api/sickness-cases/[id]/transition/route.ts
    - actions/sickness-cases.ts
    - components/sickness-report-form/index.tsx
    - components/sickness-case-detail/index.tsx
    - components/absence-history/index.tsx
    - app/(authenticated)/sickness/report/page.tsx
    - app/(authenticated)/sickness/[id]/page.tsx
    - app/(authenticated)/sickness/history/page.tsx
  modified:
    - components/sidebar/nav-items.ts
    - package.json
    - yarn.lock

key-decisions:
  - "GOV.UK bank holidays API with 24h cache and 2026 static fallback -- authoritative UK source with zero dependency"
  - "WorkflowService wraps all transitions in TenantService.withTenant for RLS + creates CaseTransition audit record atomically"
  - "Long-term threshold checked on every transition using org settings absenceTriggerThresholds.longTermDays"
  - "ACKNOWLEDGE action allowed for EMPLOYEE role (REPORT_SICKNESS permission), all other transitions require MANAGE_SICKNESS_CASES"

patterns-established:
  - "Role-based API data scoping: employee sees own, manager sees team via recursive CTE, HR/admin sees all"
  - "Transition notes modal pattern for workflow actions"
  - "AbsenceHistory TanStack Table with status filter and sortable columns"

# Metrics
duration: 6min
completed: 2026-02-15
---

# Phase 2 Plan 2: Sickness Reporting & Workflow Summary

**Sickness case reporting with state machine workflow, working days calculation via GOV.UK bank holidays API, and role-filtered absence history UI**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-15T22:15:52Z
- **Completed:** 2026-02-15T22:21:51Z
- **Tasks:** 3
- **Files modified:** 18

## Accomplishments
- Full sickness case CRUD with repositories, services, API routes, and client action wrappers
- State machine workflow enforcing VALID_TRANSITIONS with audit trail in case_transitions table
- Working days calculation excluding weekends and UK bank holidays (GOV.UK API with fallback)
- Role-based API filtering: employee sees own cases, manager sees team, HR/admin sees all org cases
- Report form with absence type select, date pickers, employee dropdown for managers, and notes encryption
- Case detail page with colour-coded status badge, chronological transition timeline, and action buttons
- Absence history with TanStack Table, sortable columns, status filter, and pagination
- Sidebar navigation links added for Report Sickness and Absence History

## Task Commits

Each task was committed atomically:

1. **Task 1: Create sickness case repositories, workflow service, and working days service** - `7b45ac8` (feat)
2. **Task 2: Create sickness case API routes** - `4a2a451` (feat)
3. **Task 3: Create sickness reporting UI and absence history page** - `d17cf17` (feat)

## Files Created/Modified
- `providers/repositories/sickness-case.repository.ts` - CRUD with team query via recursive CTE
- `providers/repositories/case-transition.repository.ts` - Immutable transition audit trail
- `providers/services/workflow.service.ts` - State machine validation and transition execution
- `providers/services/working-days.service.ts` - UK bank holiday fetch with cache and working day calculation
- `providers/services/sickness-case.service.ts` - Business logic with encryption, audit, and working days
- `app/api/sickness-cases/route.ts` - GET (list with role filtering) and POST (create with access validation)
- `app/api/sickness-cases/[id]/route.ts` - GET (detail with transitions) and PATCH (end date update)
- `app/api/sickness-cases/[id]/transition/route.ts` - POST state transition with 400 on invalid
- `actions/sickness-cases.ts` - Client fetch wrappers for all sickness case endpoints
- `components/sickness-report-form/index.tsx` - Form with React Hook Form, Zod validation, employee select
- `components/sickness-case-detail/index.tsx` - Status badge, timeline, action buttons with notes modal
- `components/absence-history/index.tsx` - TanStack Table with sorting, filtering, pagination
- `app/(authenticated)/sickness/report/page.tsx` - Report page with role-aware employee selection
- `app/(authenticated)/sickness/[id]/page.tsx` - Case detail page
- `app/(authenticated)/sickness/history/page.tsx` - Absence history page with table
- `components/sidebar/nav-items.ts` - Added Report Sickness and Absence History nav items

## Decisions Made
- GOV.UK bank holidays API with 24h in-memory cache and static 2026 fallback for resilience
- WorkflowService wraps transitions in TenantService.withTenant for atomic RLS-scoped updates
- Long-term threshold checked on every state transition using org settings (default 28 days)
- ACKNOWLEDGE action permitted for EMPLOYEE role; all other transitions require MANAGE_SICKNESS_CASES

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required. date-fns installed automatically.

## Next Phase Readiness
- Sickness case CRUD and state machine ready for fit note upload integration (Plan 03)
- WorkflowService available for RTW meeting scheduling transitions (Plan 04)
- Case detail page has placeholder text for manager guidance prompts (Plan 04)
- Absence history table ready for expanded columns when employee name joins are added

## Self-Check: PASSED

- All 15 created files verified on disk
- All 3 task commits (7b45ac8, 4a2a451, d17cf17) verified in git log
- TypeScript compiles cleanly with `npx tsc --noEmit`

---
*Phase: 02-sickness-lifecycle*
*Completed: 2026-02-15*
