---
phase: quick
plan: 01
subsystem: ui
tags: [xlsx, papaparse, shadcn-select, csv-import, column-mapping, fuzzy-matching]

requires:
  - phase: 01-foundation-and-access
    provides: CSV import wizard and employee import API
provides:
  - Excel (.xlsx/.xls) file parsing via SheetJS
  - Smart column mapping with fuzzy alias matching
  - Column mapping confirmation UI with preview data
  - JSON-based import API path with pre-parsed rows
affects: [employee-import, csv-import-wizard]

tech-stack:
  added: [xlsx (SheetJS), shadcn Select component]
  patterns: [client-side file parsing before server upload, fuzzy column alias matching]

key-files:
  created:
    - utils/column-mapping.ts
    - components/csv-import-wizard/column-mapping-step.tsx
    - components/ui/select.tsx
  modified:
    - components/csv-import-wizard/index.tsx
    - schemas/csv-import.ts
    - actions/employees.ts
    - app/api/employees/import/route.ts
    - providers/services/csv-import.service.ts

key-decisions:
  - "Client-side file parsing (PapaParse for CSV, SheetJS for Excel) before sending to server"
  - "Two-pass fuzzy matching: exact alias match first, then substring match"
  - "Dual API path: JSON body for new wizard, FormData for backward compatibility"
  - "Extracted shared validateRow method in CsvImportService to avoid duplication"

patterns-established:
  - "Column alias map pattern for header normalization across file formats"
  - "Disabled select items with (used) suffix to prevent duplicate header assignment"

duration: 5min
completed: 2026-02-16
---

# Quick Task 1: Smart Column Mapping UI for CSV/Excel Import

**Excel/CSV import wizard with fuzzy column matching, mapping confirmation UI with preview data, and dual-path API**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-16T08:11:32Z
- **Completed:** 2026-02-16T08:16:00Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Excel (.xlsx/.xls) support added to the import wizard alongside existing CSV
- Fuzzy column mapping auto-detects common aliases (Surname, Email Address, Position, Team, Line Manager, etc.)
- Column mapping confirmation screen with Select dropdowns, Required badges, and preview data from first row
- Duplicate header prevention: same file header cannot be mapped to multiple fields
- API route accepts both JSON (new path) and FormData (legacy backward compat)

## Task Commits

Each task was committed atomically:

1. **Task 1: Column mapping utility, Excel parsing setup, and schema updates** - `9b896e7` (feat)
2. **Task 2: Column mapping UI component and wizard integration with Excel support** - `152c2c8` (feat)

## Files Created/Modified
- `utils/column-mapping.ts` - Fuzzy matching utility with alias map for 6 app fields
- `components/csv-import-wizard/column-mapping-step.tsx` - Column mapping confirmation UI with Select dropdowns
- `components/ui/select.tsx` - shadcn Select component (Radix UI based)
- `components/csv-import-wizard/index.tsx` - Updated wizard: 4-step flow with Excel parsing
- `schemas/csv-import.ts` - Updated to accept .xlsx/.xls, added MappedImportPayload type
- `actions/employees.ts` - Added fetchImportEmployeesWithMapping JSON action
- `app/api/employees/import/route.ts` - Dual content-type handler (JSON + FormData)
- `providers/services/csv-import.service.ts` - Added parseAndValidateRows, extracted shared validateRow

## Decisions Made
- Client-side file parsing: CSV via PapaParse (already installed), Excel via SheetJS (new dependency). This avoids sending raw binary files to the server and enables the mapping UI to show preview data before import.
- Two-pass fuzzy matching: exact alias matches get priority over substring matches to avoid false positives (e.g., "manager_email" should not steal "email" from the email field).
- Dual API paths preserved: the old FormData CSV upload still works for backward compatibility, while the new JSON path supports pre-parsed rows with confirmed column mappings.
- Extracted `validateRow` as a shared private method in CsvImportService to avoid duplicating validation logic between `parseAndValidate` (CSV) and `parseAndValidateRows` (JSON).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- shadcn CLI (`npx shadcn@latest add select`) required a `components.json` that did not exist in the project (UI components were added manually). Created the Select component manually following existing patterns.

## User Setup Required

None - no external service configuration required.

## Self-Check: PASSED

All 8 files verified present. Both task commits (9b896e7, 152c2c8) confirmed in git log. `yarn tsc --noEmit` and `yarn build` both pass.
