---
phase: 02-sickness-lifecycle
plan: 03
subsystem: api, storage, ui
tags: [supabase-storage, fit-notes, file-upload, signed-urls, cron, rbac, multipart]

# Dependency graph
requires:
  - phase: 02-02
    provides: "Sickness case model, WorkflowService state machine, RBAC permissions"
provides:
  - "StorageService for Supabase Storage upload/download/delete"
  - "FitNoteService with FIT-04 role-based access control"
  - "FitNoteRepository for fit_notes table CRUD and expiry queries"
  - "Fit note API routes (list, upload, download, cron expiry)"
  - "Fit note upload UI with drag-and-drop and metadata form"
  - "Fit note list UI with expiry badges and download buttons"
affects: [02-04, 02-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Supabase Storage private bucket with signed URL access"
    - "Multipart FormData upload via Next.js API routes"
    - "Cron endpoint with CRON_SECRET bearer token auth"
    - "FIT-04 manager exclusion from document access"

key-files:
  created:
    - providers/services/storage.service.ts
    - providers/repositories/fit-note.repository.ts
    - providers/services/fit-note.service.ts
    - app/api/sickness-cases/[id]/fit-notes/route.ts
    - app/api/sickness-cases/[id]/fit-notes/[fitNoteId]/download/route.ts
    - app/api/cron/fit-note-expiry/route.ts
    - actions/fit-notes.ts
    - components/fit-note-upload/index.tsx
    - components/fit-note-list/index.tsx
    - app/(authenticated)/sickness/[id]/fit-notes/page.tsx
  modified: []

key-decisions:
  - "Supabase Storage private bucket with 5-minute signed URLs for secure document access"
  - "FIT-04: managers explicitly blocked from fit note access at service layer (not just permission layer)"
  - "Cron endpoint protected by CRON_SECRET env var, not user auth"
  - "functionalEffects sent as JSON string in FormData to handle array serialization"
  - "File cleanup on upload failure (delete from storage if DB insert fails)"

patterns-established:
  - "StorageService pattern: validate -> upload -> return path, then getSignedUrl on demand"
  - "Cron route pattern: bearer token auth via CRON_SECRET, configurable params, monitoring-friendly response"

# Metrics
duration: 5min
completed: 2026-02-15
---

# Phase 2 Plan 3: Fit Note Management Summary

**Secure fit note upload to Supabase Storage with signed URL downloads, FIT-04 manager exclusion, expiry tracking cron, and upload/list UI with drag-and-drop**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-15T22:24:49Z
- **Completed:** 2026-02-15T22:30:27Z
- **Tasks:** 3
- **Files created:** 10

## Accomplishments

- StorageService wraps Supabase Storage with file validation (PDF/image, 10MB max) and 5-minute signed URL generation
- FitNoteService enforces FIT-04: managers blocked from viewing/downloading fit notes at the service layer
- Upload triggers WorkflowService.transition(RECEIVE_FIT_NOTE) to advance sickness case state
- Cron endpoint at /api/cron/fit-note-expiry identifies fit notes expiring within configurable days
- Upload form with drag-and-drop, metadata fields, and conditional functional effects checkboxes
- Fit note list with colour-coded expiry badges (green >7d, amber 3-7d, red <3d/expired)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create storage service, fit note repository and service** - `0f0ce5d` (feat)
2. **Task 2: Create fit note API routes, cron endpoint, and actions** - `ac054b8` (feat)
3. **Task 3: Create fit note upload and list UI** - `a8508eb` (feat)

## Files Created

- `providers/services/storage.service.ts` - Supabase Storage wrapper (upload, getSignedUrl, delete)
- `providers/repositories/fit-note.repository.ts` - fit_notes table CRUD with expiry query
- `providers/services/fit-note.service.ts` - Business logic with FIT-04 role enforcement
- `app/api/sickness-cases/[id]/fit-notes/route.ts` - GET (list) and POST (multipart upload)
- `app/api/sickness-cases/[id]/fit-notes/[fitNoteId]/download/route.ts` - GET signed URL
- `app/api/cron/fit-note-expiry/route.ts` - Cron endpoint for expiry monitoring
- `actions/fit-notes.ts` - Client-side fetch wrappers for fit note operations
- `components/fit-note-upload/index.tsx` - Drag-and-drop upload form with metadata
- `components/fit-note-list/index.tsx` - Card list with expiry badges and download buttons
- `app/(authenticated)/sickness/[id]/fit-notes/page.tsx` - Fit notes page with role-based access

## Decisions Made

- Supabase Storage private bucket with 5-minute signed URLs for secure document access (not direct URLs)
- FIT-04 enforced at service layer via assertNotManager() -- managers with elevated roles (HR dual-role) retain access
- Cron endpoint uses CRON_SECRET bearer token rather than user auth session
- functionalEffects serialized as JSON string in FormData to handle array values cleanly
- Storage cleanup on failure: uploaded file deleted if database record creation fails

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration:**
- Create private bucket named `fit-notes` in Supabase Storage dashboard (Storage > New bucket > Name: fit-notes, Public: OFF)
- Set `CRON_SECRET` environment variable for the fit note expiry cron endpoint

## Next Phase Readiness

- Fit note management complete, ready for RTW meetings (02-04) and notifications (02-05)
- Cron endpoint ready to be connected to notification system in 02-05

## Self-Check: PASSED

All 10 created files verified present. All 3 task commits verified in git log.

---
*Phase: 02-sickness-lifecycle*
*Completed: 2026-02-15*
