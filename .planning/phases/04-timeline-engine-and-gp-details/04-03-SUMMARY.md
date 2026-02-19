---
phase: 04-timeline-engine-and-gp-details
plan: 03
subsystem: api, ui
tags: [gp-details, medical-consent, rbac, audit-log, react-hook-form, zod]

requires:
  - phase: 04-01
    provides: "Schema for gp_name/gp_address/gp_phone columns on employees and medical_records_consent table"
provides:
  - "MedicalConsentRepository with upsert and query methods"
  - "GpService with GP detail updates and consent grant/revoke with audit logging"
  - "API routes for GP details (GET/PUT) and consent (GET/POST) with ownership checks"
  - "Organisation consent overview route for HR"
  - "GP details form and consent form on employee profile page"
  - "ConsentStatusBadge component for consent status display"
affects: [employee-profile, hr-dashboard, absence-timeline]

tech-stack:
  added: []
  patterns:
    - "Ownership-based access control (employee.userId === sessionUser.id) for sensitive data"
    - "Upsert pattern with ON CONFLICT for single-record-per-employee consent"

key-files:
  created:
    - providers/repositories/medical-consent.repository.ts
    - providers/services/gp.service.ts
    - app/api/employees/[id]/gp-details/route.ts
    - app/api/employees/[id]/consent/route.ts
    - app/api/organisations/[slug]/consent/route.ts
    - actions/gp-details.ts
    - components/gp-details-form/index.tsx
    - components/consent-form/index.tsx
    - components/consent-status-badge/index.tsx
  modified:
    - providers/repositories/employee.repository.ts
    - app/(authenticated)/my-profile/page.tsx

key-decisions:
  - "Employee ID resolved via fetchMyData on profile page to avoid new API endpoint"
  - "Consent revoke uses Dialog confirmation rather than AlertDialog (not installed)"

patterns-established:
  - "Ownership check pattern: load employee, verify employee.userId === sessionUser.id before allowing access"
  - "GP/consent forms loaded lazily on profile page, hidden for non-employee users"

duration: 4min
completed: 2026-02-19
---

# Phase 4 Plan 3: GP Details and Medical Consent Summary

**GP details storage with consent grant/revoke workflow, audit-logged API routes with ownership enforcement, and profile page integration**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-19T15:06:05Z
- **Completed:** 2026-02-19T15:10:49Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Employee can enter GP name, address, and phone on their profile page via validated form
- Medical records consent workflow with grant, revoke (with confirmation dialog), and re-grant
- HR can view all employee consent statuses via organisation consent endpoint
- All GP detail updates and consent changes are audit logged
- Ownership-based access control ensures employees can only edit their own GP data

## Task Commits

Each task was committed atomically:

1. **Task 1: Create repositories, service, and API routes** - `801e605` (feat)
2. **Task 2: Create GP details form, consent form, consent badge, and profile integration** - `663b975` (feat)

## Files Created/Modified
- `providers/repositories/employee.repository.ts` - Added getGpDetails and updateGpDetails methods
- `providers/repositories/medical-consent.repository.ts` - CRUD for medical_records_consent with upsert
- `providers/services/gp.service.ts` - Business logic for GP updates and consent management with audit
- `app/api/employees/[id]/gp-details/route.ts` - GET/PUT with ownership and permission checks
- `app/api/employees/[id]/consent/route.ts` - GET/POST with ownership and permission checks
- `app/api/organisations/[slug]/consent/route.ts` - GET for HR consent overview
- `actions/gp-details.ts` - Client-side fetch wrappers for all GP and consent endpoints
- `components/gp-details-form/index.tsx` - Form with RHF/Zod for GP name, address, phone
- `components/consent-form/index.tsx` - Consent workflow with grant/revoke and confirmation dialog
- `components/consent-status-badge/index.tsx` - Colour-coded badge for consent status
- `app/(authenticated)/my-profile/page.tsx` - Integrated GP details and consent sections

## Decisions Made
- Used fetchMyData to resolve employee ID on the profile page rather than creating a new API endpoint
- Used Dialog component for revoke confirmation since AlertDialog is not installed in the project
- Consent notes field is optional, available for both grant and revoke actions

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- GP details and consent workflow complete for milestone v1.2
- Phase 04 all plans complete (01: schema, 02: timeline engine, 03: GP details)
- Ready for phase 05 or milestone wrap-up

---
*Phase: 04-timeline-engine-and-gp-details*
*Completed: 2026-02-19*
