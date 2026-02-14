---
phase: 01-foundation-and-access
plan: 05
subsystem: csv-import-sar
tags: [csv-import, papaparse, sar, compliance, reporting-chain, data-subject, drag-and-drop, wizard]

# Dependency graph
requires:
  - phase: 01-03
    provides: "Organisation CRUD, DepartmentRepository.findOrCreate()"
  - phase: 01-04
    provides: "Employee CRUD, EmployeeRepository.findByEmail(), findByManagerChain(), EmployeeService"
provides:
  - CSV import service with parse/validate/duplicate detection/manager linking (ORG-01)
  - CSV import wizard UI with drag-and-drop upload and results summary
  - CSV import API endpoint (POST /api/employees/import)
  - SAR data endpoint (GET /api/me/data) for COMP-05
  - DataSubjectView component for displaying held data
  - My Data page at /my-data
  - Employee repository: getReportingChain, getDataSubjectRecord
  - Employee service: getTeamForManager, getMyData
  - DataSubjectRecord type for SAR readiness
affects: [02-sickness-workflow]

# Tech tracking
tech-stack:
  added: [papaparse, "@types/papaparse"]
  patterns: [CSV import pipeline (parse -> validate -> deduplicate -> import -> link managers), two-pass import (create employees then link managers), SAR data assembly from multiple tables]

key-files:
  created:
    - providers/services/csv-import.service.ts
    - schemas/csv-import.ts
    - app/api/employees/import/route.ts
    - app/api/me/data/route.ts
    - app/(authenticated)/employees/import/page.tsx
    - app/(authenticated)/my-data/page.tsx
    - components/csv-import-wizard/index.tsx
    - components/data-subject-view/index.tsx
  modified:
    - providers/repositories/employee.repository.ts
    - providers/services/employee.service.ts
    - actions/employees.ts
    - types/database.ts
    - package.json

key-decisions:
  - "papaparse for CSV parsing instead of manual string splitting (handles quoted fields, edge cases)"
  - "Two-pass import: create all employees first, then link managers (handles forward references within CSV)"
  - "SAR data includes audit log entries both about the employee and by the employee"
  - "CSV import wizard uses single-page flow with step transitions rather than multi-page wizard"

patterns-established:
  - "CSV import pipeline: parse with papaparse -> validate with Zod -> check duplicates -> import -> link managers"
  - "Two-pass bulk import: first pass creates records, second pass resolves relationships"
  - "SAR data assembly: join personal info, roles, and audit trail into DataSubjectRecord"
  - "File upload: drag-and-drop zone with file input fallback"

# Metrics
duration: 5min
completed: 2026-02-14
---

# Phase 1 Plan 5: CSV Import & SAR Data Summary

**CSV import with papaparse parsing, Zod validation, duplicate skip, and manager linking plus SAR data view for COMP-05 compliance**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-14T12:26:18Z
- **Completed:** 2026-02-14T12:31:47Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Full CSV import pipeline: parse, validate, detect duplicates, create employees, link managers (ORG-01)
- CSV import wizard UI with drag-and-drop upload, validation results, and comprehensive results summary
- SAR data endpoint returning all data held about a user (COMP-05) with personal info, roles, and audit trail
- Two-pass import handles forward manager references within the same CSV file
- All import actions audit logged with row counts metadata

## Task Commits

Each task was committed atomically:

1. **Task 1: CSV import service, SAR data endpoint, and reporting chain** - `8c9fa58` (feat)
2. **Task 2: CSV import wizard UI and SAR data view page** - `7e95ed7` (feat)

## Files Created/Modified
- `providers/services/csv-import.service.ts` - CsvImportService with parseAndValidate() and importValidRows()
- `schemas/csv-import.ts` - Zod schemas (CsvRowSchema, CsvFileSchema) and import result types
- `app/api/employees/import/route.ts` - POST endpoint for multipart CSV upload with auth checks
- `app/api/me/data/route.ts` - GET endpoint for SAR data (any authenticated user)
- `providers/repositories/employee.repository.ts` - Added getReportingChain() and getDataSubjectRecord()
- `providers/services/employee.service.ts` - Added getTeamForManager() and getMyData()
- `actions/employees.ts` - Added fetchImportEmployees() and fetchMyData()
- `types/database.ts` - Added DataSubjectRecord interface
- `app/(authenticated)/employees/import/page.tsx` - CSV import wizard page (org admin)
- `app/(authenticated)/my-data/page.tsx` - SAR data view page
- `components/csv-import-wizard/index.tsx` - CsvImportWizard with upload/import/results flow
- `components/data-subject-view/index.tsx` - DataSubjectView with personal info, roles, activity log
- `package.json` - Added papaparse and @types/papaparse

## Decisions Made
- Used papaparse for CSV parsing (handles quoted fields, multi-line values, and edge cases that manual splitting misses)
- Two-pass import strategy: first pass creates all employee records, second pass resolves manager references (handles forward references where a manager appears later in the CSV)
- SAR data includes both audit entries about the employee (entity_id match) and entries by the employee (user_id match)
- CSV import wizard uses a single-page step flow (upload -> importing -> results) rather than a multi-page wizard for simplicity

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed papaparse for CSV parsing**
- **Found during:** Task 1 (pre-execution)
- **Issue:** papaparse not installed. Plan suggested either manual splitting or papaparse -- chose papaparse for robustness
- **Fix:** Installed papaparse and @types/papaparse via yarn
- **Files modified:** package.json, yarn.lock
- **Verification:** TypeScript compiles, imports resolve

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary dependency installation. Plan explicitly mentioned papaparse as an option.

## Issues Encountered
None.

## User Setup Required
None - relies on Auth0 and database credentials from Plans 01 and 02.

## Next Phase Readiness
- Phase 1 is now complete: all 5 plans delivered
- Foundation infrastructure ready for Phase 2 (Sickness & Return-to-Work workflow)
- All compliance foundations in place: audit logging (COMP-01), encryption (COMP-02), RBAC (AUTH-06), SAR readiness (COMP-05)
- **Blocker:** Database migrations and Auth0 credentials must be configured before testing (documented in Plans 01/02)

## Self-Check: PASSED

All 13 key files verified present. All 2 task commits (8c9fa58, 7e95ed7) verified in git history.

---
*Phase: 01-foundation-and-access*
*Completed: 2026-02-14*
