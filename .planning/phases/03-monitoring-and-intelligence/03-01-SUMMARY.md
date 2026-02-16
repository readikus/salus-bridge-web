---
phase: 03-monitoring-and-intelligence
plan: 01
subsystem: api, database, ui
tags: [bradford-factor, trigger-points, absence-monitoring, rls, radix-tabs, radix-switch]

# Dependency graph
requires:
  - phase: 02-sickness-lifecycle
    provides: "Sickness case tables, SicknessCaseRepository, NotificationService, WorkflowService"
provides:
  - "trigger_configs and trigger_alerts tables with RLS"
  - "BradfordFactorService for S*S*D calculation"
  - "TriggerService for threshold evaluation and alert dispatch"
  - "CRUD API routes for trigger configs"
  - "Bradford Factor API for org-wide and per-employee scores"
  - "Trigger configuration UI with tabbed rules and alerts views"
  - "BradfordFactorBadge component for risk-level display"
  - "MANAGE_TRIGGERS and VIEW_TRIGGERS permissions"
affects: [03-02, 03-03, analytics, dashboard]

# Tech tracking
tech-stack:
  added: ["@radix-ui/react-tabs", "@radix-ui/react-switch"]
  patterns: ["fire-and-forget trigger evaluation", "alert deduplication via trigger+case pair", "privacy-safe notification (first name + last initial)"]

key-files:
  created:
    - database/migrations/20260216000001_create_trigger_configs.ts
    - database/migrations/20260216000002_create_trigger_alerts.ts
    - constants/bradford-factor.ts
    - schemas/trigger-config.ts
    - providers/repositories/trigger-config.repository.ts
    - providers/repositories/trigger-alert.repository.ts
    - providers/services/bradford-factor.service.ts
    - providers/services/trigger.service.ts
    - emails/trigger-alert.tsx
    - app/api/organisations/[slug]/triggers/route.ts
    - app/api/organisations/[slug]/triggers/[id]/route.ts
    - app/api/organisations/[slug]/bradford-factor/route.ts
    - app/api/employees/[id]/bradford-factor/route.ts
    - actions/triggers.ts
    - actions/bradford-factor.ts
    - components/trigger-config-form/index.tsx
    - components/bradford-factor-badge/index.tsx
    - app/(authenticated)/organisations/[slug]/triggers/page.tsx
    - components/ui/tabs.tsx
    - components/ui/switch.tsx
  modified:
    - types/database.ts
    - types/enums.ts
    - constants/permissions.ts
    - providers/services/sickness-case.service.ts
    - providers/services/workflow.service.ts
    - components/sidebar/nav-items.ts

key-decisions:
  - "Bradford Factor uses simple weekday count (not WorkingDaysService) for ongoing cases -- bank holidays not relevant"
  - "Alert deduplication by trigger_config_id + sickness_case_id pair to prevent duplicate alerts"
  - "Trigger evaluation is fire-and-forget wrapped in try/catch -- failures logged but never block case creation"
  - "Alerts tab uses PATCH on trigger/[id] for acknowledge action (reuses same route file)"

patterns-established:
  - "Trigger evaluation pattern: evaluate() called after case create and workflow transition (TRACKING/CLOSED)"
  - "Privacy-safe alerting: employee name = first name + last initial only in notifications"

# Metrics
duration: 8min
completed: 2026-02-16
---

# Phase 3 Plan 1: Trigger Points and Bradford Factor Summary

**Absence trigger system with configurable thresholds (frequency, Bradford Factor, duration), automated alert dispatch to managers/HR, and tabbed configuration UI**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-16T21:59:31Z
- **Completed:** 2026-02-16T22:07:31Z
- **Tasks:** 3
- **Files modified:** 26

## Accomplishments
- Database schema for trigger configs and alerts with RLS policies and indexes
- Bradford Factor calculation service (S*S*D formula) with 52-week rolling lookback and risk levels
- Trigger evaluation engine integrates into sickness case creation and workflow transitions
- Full CRUD API for trigger configurations with RBAC permission enforcement
- Tabbed UI for managing trigger rules and viewing/acknowledging alerts
- BradfordFactorBadge component renders color-coded risk level badges

## Task Commits

Each task was committed atomically:

1. **Task 1: Database schema, types, constants, and Bradford Factor service** - `11749f2` (feat)
2. **Task 2: Trigger evaluation service, alert notifications, and API routes** - `0cd1fde` (feat)
3. **Task 3: Trigger configuration UI and Bradford Factor display** - `cfe66d9` (feat)

## Files Created/Modified
- `database/migrations/20260216000001_create_trigger_configs.ts` - trigger_configs table with RLS
- `database/migrations/20260216000002_create_trigger_alerts.ts` - trigger_alerts table with RLS
- `constants/bradford-factor.ts` - Risk levels, lookback config, getBradfordRiskLevel helper
- `schemas/trigger-config.ts` - Zod validation with type-dependent periodDays refinement
- `providers/repositories/trigger-config.repository.ts` - CRUD for trigger configurations
- `providers/repositories/trigger-alert.repository.ts` - Alert queries, dedup check, acknowledge
- `providers/services/bradford-factor.service.ts` - S*S*D calculation, team aggregation
- `providers/services/trigger.service.ts` - Evaluate triggers, fire alerts, send notifications
- `emails/trigger-alert.tsx` - Privacy-safe alert email template
- `app/api/organisations/[slug]/triggers/route.ts` - GET configs/alerts, POST create config
- `app/api/organisations/[slug]/triggers/[id]/route.ts` - PUT update, DELETE, PATCH acknowledge
- `app/api/organisations/[slug]/bradford-factor/route.ts` - Org-wide Bradford Factor scores
- `app/api/employees/[id]/bradford-factor/route.ts` - Per-employee Bradford Factor
- `actions/triggers.ts` - Client-side fetch wrappers for trigger CRUD and alerts
- `actions/bradford-factor.ts` - Client-side fetch wrappers for Bradford Factor API
- `components/trigger-config-form/index.tsx` - Form with dynamic fields by trigger type
- `components/bradford-factor-badge/index.tsx` - Color-coded risk level badge
- `app/(authenticated)/organisations/[slug]/triggers/page.tsx` - Tabbed triggers page
- `components/ui/tabs.tsx` - Radix Tabs primitive
- `components/ui/switch.tsx` - Radix Switch primitive
- `types/database.ts` - Added TriggerConfig, TriggerAlert, TriggerAlertWithDetails interfaces
- `types/enums.ts` - Added TRIGGER_CONFIG, TRIGGER_ALERT entities; ALERT, ACKNOWLEDGE actions
- `constants/permissions.ts` - Added MANAGE_TRIGGERS, VIEW_TRIGGERS with role mappings
- `providers/services/sickness-case.service.ts` - Added fire-and-forget TriggerService.evaluate call
- `providers/services/workflow.service.ts` - Added trigger evaluation on TRACKING/CLOSED transitions
- `components/sidebar/nav-items.ts` - Added Triggers nav item for admin/HR/manager roles

## Decisions Made
- Bradford Factor uses simple weekday count for ongoing cases (bank holidays not relevant for this metric)
- Alert deduplication uses trigger_config_id + sickness_case_id pair check before creating alerts
- Trigger evaluation is fire-and-forget with try/catch to prevent blocking the main case workflow
- PATCH on the trigger/[id] route serves double duty for acknowledging alerts (keeps routes lean)
- Installed @radix-ui/react-tabs and @radix-ui/react-switch for shadcn-compatible UI primitives

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing Radix UI dependencies**
- **Found during:** Task 3 (UI components)
- **Issue:** @radix-ui/react-tabs and @radix-ui/react-switch not installed
- **Fix:** `yarn add @radix-ui/react-tabs @radix-ui/react-switch` and created shadcn/ui wrapper components
- **Files modified:** package.json, yarn.lock, components/ui/tabs.tsx, components/ui/switch.tsx
- **Verification:** TypeScript compilation passes, components render correctly
- **Committed in:** cfe66d9 (Task 3 commit)

**2. [Rule 2 - Missing Critical] Added ACKNOWLEDGE audit action**
- **Found during:** Task 1 (enum setup)
- **Issue:** Plan specified acknowledging alerts but no corresponding audit action existed
- **Fix:** Added ACKNOWLEDGE to AuditAction enum alongside ALERT
- **Files modified:** types/enums.ts
- **Verification:** Acknowledge audit logging works in TriggerService.acknowledgeAlert
- **Committed in:** 11749f2 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical)
**Impact on plan:** Both auto-fixes necessary for functionality. No scope creep.

## Issues Encountered
- Pre-existing TypeScript errors in oh-referral-form component (from another plan) -- unrelated to this plan's work, not addressed

## User Setup Required
None - no external service configuration required. Migrations need to be run when DATABASE_URL is available.

## Next Phase Readiness
- Trigger system complete and integrated into sickness lifecycle
- Ready for Plan 02 (analytics/reporting) which can consume Bradford Factor data
- Ready for Plan 03 (OH referrals) which can reference trigger alerts

---
*Phase: 03-monitoring-and-intelligence*
*Completed: 2026-02-16*
