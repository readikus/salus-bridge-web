---
phase: 03-monitoring-and-intelligence
plan: 03
subsystem: api, ui, database
tags: [occupational-health, referrals, rls, rbac, encryption, status-machine]

# Dependency graph
requires:
  - phase: 02-sickness-lifecycle
    provides: "Sickness cases, employees, encryption service, tenant isolation"
  - phase: 03-monitoring-and-intelligence (plan 01-02)
    provides: "Trigger configs, audit patterns, RLS policies"
provides:
  - "OH providers table with org-scoped CRUD"
  - "OH referrals table linked to sickness cases with status state machine"
  - "OH referral communications table for bidirectional message logging"
  - "OhReferralService with lifecycle management, encryption, and audit logging"
  - "Provider management UI with card grid and dialog-based CRUD"
  - "Referral list with status filtering and detail page with transition buttons"
  - "Communication log component with timeline display"
affects: [reporting, notifications, employee-detail]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Status state machine with VALID_REFERRAL_TRANSITIONS map"
    - "Dialog-based CRUD forms for inline entity management"
    - "Communication log with directional timeline (INBOUND/OUTBOUND)"

key-files:
  created:
    - database/migrations/20260216000003_create_oh_providers.ts
    - database/migrations/20260216000004_create_oh_referrals.ts
    - constants/referral-statuses.ts
    - schemas/oh-provider.ts
    - schemas/oh-referral.ts
    - providers/repositories/oh-provider.repository.ts
    - providers/repositories/oh-referral.repository.ts
    - providers/services/oh-referral.service.ts
    - app/api/organisations/[slug]/oh-providers/route.ts
    - app/api/organisations/[slug]/oh-providers/[id]/route.ts
    - app/api/organisations/[slug]/oh-referrals/route.ts
    - app/api/organisations/[slug]/oh-referrals/[id]/route.ts
    - app/api/organisations/[slug]/oh-referrals/[id]/communications/route.ts
    - actions/oh-providers.ts
    - actions/oh-referrals.ts
    - components/oh-provider-form/index.tsx
    - components/oh-referral-form/index.tsx
    - components/referral-status-badge/index.tsx
    - components/communication-log/index.tsx
    - components/ui/dialog.tsx
    - components/ui/textarea.tsx
    - app/(authenticated)/organisations/[slug]/oh-providers/page.tsx
    - app/(authenticated)/organisations/[slug]/oh-referrals/page.tsx
    - app/(authenticated)/organisations/[slug]/oh-referrals/[id]/page.tsx
  modified:
    - types/database.ts
    - types/enums.ts
    - constants/permissions.ts
    - components/sidebar/nav-items.ts

key-decisions:
  - "Used Dialog-based forms (shadcn Dialog + RHF) for provider and referral creation rather than separate pages"
  - "Report notes encrypted via EncryptionService on REPORT_RECEIVED status transition"
  - "RLS on oh_referral_communications via EXISTS join through oh_referrals for org isolation"

patterns-established:
  - "Status state machine: enum + VALID_TRANSITIONS record + service-level validation"
  - "Dialog-based CRUD: inline form within Dialog for entity management on list pages"

# Metrics
duration: 8min
completed: 2026-02-16
---

# Phase 3 Plan 3: OH Provider Integration Summary

**OH provider CRUD with referral lifecycle tracking (SUBMITTED -> IN_PROGRESS -> REPORT_RECEIVED -> CLOSED), encrypted report notes, and bidirectional communication logging**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-16T21:59:42Z
- **Completed:** 2026-02-16T22:07:58Z
- **Tasks:** 2
- **Files modified:** 29

## Accomplishments
- OH providers table with RLS org isolation and full CRUD API/UI
- OH referrals linked to sickness cases with validated status state machine and encrypted report notes
- Communication log for bidirectional message tracking between organisation and OH provider
- Four new RBAC permissions (MANAGE_OH_PROVIDERS, VIEW_OH_PROVIDERS, CREATE_REFERRAL, VIEW_REFERRALS) across roles

## Task Commits

Each task was committed atomically:

1. **Task 1: Database schema, types, repositories, and referral service** - `50526ff` (feat)
2. **Task 2: OH provider management UI and referral tracking UI** - `e975c92` (feat)

## Files Created/Modified
- `database/migrations/20260216000003_create_oh_providers.ts` - OH providers table with RLS
- `database/migrations/20260216000004_create_oh_referrals.ts` - OH referrals and communications tables with RLS
- `constants/referral-statuses.ts` - ReferralStatus enum with valid transitions and labels
- `schemas/oh-provider.ts` - Zod schema for provider input validation
- `schemas/oh-referral.ts` - Zod schemas for referral creation, status update, and communication
- `providers/repositories/oh-provider.repository.ts` - Provider CRUD repository
- `providers/repositories/oh-referral.repository.ts` - Referral CRUD with joins and communications
- `providers/services/oh-referral.service.ts` - Referral lifecycle with status validation and encryption
- `app/api/organisations/[slug]/oh-providers/route.ts` - GET/POST for provider list and creation
- `app/api/organisations/[slug]/oh-providers/[id]/route.ts` - PUT/DELETE for provider updates
- `app/api/organisations/[slug]/oh-referrals/route.ts` - GET/POST for referral list and creation
- `app/api/organisations/[slug]/oh-referrals/[id]/route.ts` - GET/PATCH for referral detail and status
- `app/api/organisations/[slug]/oh-referrals/[id]/communications/route.ts` - GET/POST for communication log
- `actions/oh-providers.ts` - Client-side provider API wrappers
- `actions/oh-referrals.ts` - Client-side referral API wrappers
- `components/oh-provider-form/index.tsx` - Provider form with RHF + Zod
- `components/oh-referral-form/index.tsx` - Referral form with case/provider selects
- `components/referral-status-badge/index.tsx` - Color-coded status badge
- `components/communication-log/index.tsx` - Timeline communication display with add form
- `components/ui/dialog.tsx` - shadcn Dialog component
- `components/ui/textarea.tsx` - shadcn Textarea component
- `app/(authenticated)/organisations/[slug]/oh-providers/page.tsx` - Provider management card grid
- `app/(authenticated)/organisations/[slug]/oh-referrals/page.tsx` - Referral list with status filter
- `app/(authenticated)/organisations/[slug]/oh-referrals/[id]/page.tsx` - Referral detail with transitions and comms
- `types/database.ts` - OhProvider, OhReferral, OhReferralCommunication interfaces
- `types/enums.ts` - OH_PROVIDER, OH_REFERRAL audit entities; REFER audit action
- `constants/permissions.ts` - OH provider and referral permissions added to roles
- `components/sidebar/nav-items.ts` - OH Providers and Referrals nav items

## Decisions Made
- Used Dialog-based forms for provider and referral creation rather than separate pages -- keeps workflow in context
- Report notes encrypted via EncryptionService when transitioning to REPORT_RECEIVED -- health data protection
- RLS on oh_referral_communications via EXISTS join through oh_referrals for org isolation -- same pattern as case_transitions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created missing Dialog and Textarea UI components**
- **Found during:** Task 2 (UI components)
- **Issue:** Plan referenced Dialog and Textarea shadcn components but they did not exist. shadcn CLI not configured.
- **Fix:** Created components/ui/dialog.tsx and components/ui/textarea.tsx manually following shadcn patterns using the already-installed @radix-ui/react-dialog package.
- **Files modified:** components/ui/dialog.tsx, components/ui/textarea.tsx
- **Verification:** TypeScript compiles cleanly
- **Committed in:** e975c92 (Task 2 commit)

**2. [Rule 1 - Bug] Fixed ReferralUrgency enum type mismatch in form**
- **Found during:** Task 2 (TypeScript verification)
- **Issue:** OhReferralForm used string literals "STANDARD"/"URGENT" but the Zod schema expected the ReferralUrgency enum type
- **Fix:** Imported ReferralUrgency enum and used enum values instead of string literals
- **Files modified:** components/oh-referral-form/index.tsx
- **Verification:** npx tsc --noEmit passes cleanly
- **Committed in:** e975c92 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes necessary for functionality. No scope creep.

## Issues Encountered
None beyond the auto-fixed items above.

## User Setup Required
None - no external service configuration required. Migrations need to be run against the database.

## Next Phase Readiness
- Phase 3 (Monitoring and Intelligence) is now complete with trigger configs, analytics, and OH providers
- OH referral system ready for integration with employee detail views and notification workflows
- Report notes encryption ensures health data compliance

## Self-Check: PASSED

All 24 created files verified present. Both task commits (50526ff, e975c92) verified in git log. TypeScript compiles cleanly.

---
*Phase: 03-monitoring-and-intelligence*
*Completed: 2026-02-16*
