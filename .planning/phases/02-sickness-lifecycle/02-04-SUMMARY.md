---
phase: 02-sickness-lifecycle
plan: 04
subsystem: api
tags: [rtw, return-to-work, guidance, questionnaire, state-machine, empathetic-management, uk-employment-law]

# Dependency graph
requires:
  - phase: 02-sickness-lifecycle/02
    provides: "SicknessCaseRepository, WorkflowService, SicknessState/SicknessAction enums, VALID_TRANSITIONS, SicknessCaseService"
  - phase: 01-foundation-and-access
    provides: "TenantService, AuditLogService, EncryptionService, RBAC permissions, auth helpers"
provides:
  - "RtwMeetingRepository and RtwMeetingService for scheduling, completing, and cancelling RTW meetings"
  - "GuidanceRepository and GuidanceService for context-appropriate manager guidance with engagement tracking"
  - "GUIDANCE_SCRIPTS constant with 5 scripts (18 steps) covering initial contact, check-in, and RTW meetings"
  - "API routes: GET/POST/PATCH /api/sickness-cases/[id]/rtw-meeting, GET/POST /api/guidance/[caseId]"
  - "Client actions: fetchRtwMeetings, fetchScheduleRtwMeeting, fetchCompleteRtwMeeting, fetchCancelRtwMeeting, fetchGuidance, fetchTrackEngagement"
  - "RTW meeting form with scheduling, questionnaire (5 sections), and adjustment builder UI"
  - "Guidance panel with expandable steps, do/don't lists, and engagement progress tracking"
affects: [02-05]

# Tech tracking
tech-stack:
  added: []
  patterns: ["GuidanceService maps case state to guidance type for context-appropriate scripts", "Expandable card pattern with engagement tracking for guidance steps", "Two-column RTW page with meeting form and guidance sidebar"]

key-files:
  created:
    - providers/repositories/rtw-meeting.repository.ts
    - providers/repositories/guidance.repository.ts
    - providers/services/rtw-meeting.service.ts
    - providers/services/guidance.service.ts
    - constants/guidance-content.ts
    - app/api/sickness-cases/[id]/rtw-meeting/route.ts
    - app/api/guidance/[caseId]/route.ts
    - actions/rtw-meetings.ts
    - actions/guidance.ts
    - components/rtw-meeting-form/index.tsx
    - components/rtw-questionnaire/index.tsx
    - components/guidance-panel/index.tsx
    - app/(authenticated)/sickness/[id]/rtw/page.tsx
  modified: []

key-decisions:
  - "5 guidance scripts covering initial_contact (mental_health, musculoskeletal, general), check_in (general), rtw_meeting (general) with fallback to general"
  - "Guidance type determined by case state: REPORTED/TRACKING -> initial_contact, FIT_NOTE_RECEIVED -> check_in, RTW_SCHEDULED/RTW_COMPLETED -> rtw_meeting"
  - "RTW meeting outcomes encrypted via EncryptionService; questionnaire responses stored as JSONB (non-sensitive)"
  - "Cancelling an RTW meeting does NOT trigger a state transition (case stays in current state)"

patterns-established:
  - "Guidance panel with expandable step cards, do/don't lists, rationale toggle, and mark-as-reviewed engagement tracking"
  - "Two-column RTW page layout: meeting form/questionnaire (2/3) + guidance sidebar (1/3)"
  - "Structured questionnaire with dynamic adjustment builder (type dropdown, description, optional review date)"

# Metrics
duration: 40min
completed: 2026-02-15
---

# Phase 2 Plan 4: RTW Meeting & Guidance Summary

**Return-to-work meeting workflow with structured questionnaire, dynamic adjustment builder, and 5 empathetic UK-compliant manager guidance scripts (18 steps) with engagement tracking**

## Performance

- **Duration:** 40 min
- **Started:** 2026-02-15T22:25:03Z
- **Completed:** 2026-02-15T23:05:33Z
- **Tasks:** 3
- **Files modified:** 13

## Accomplishments
- Full RTW meeting lifecycle: schedule (triggers SCHEDULE_RTW), complete with questionnaire (triggers COMPLETE_RTW), cancel
- 5 guidance scripts with 18 total steps covering mental health initial contact, musculoskeletal initial contact, general initial contact, check-in, and RTW meeting scenarios
- Structured 5-section questionnaire capturing feelings about return, support needs, workload concerns, adjustment preferences, and additional notes
- Dynamic adjustment builder with type dropdown (phased return, altered hours, amended duties, adapted workplace), description, and optional review date
- Guidance panel with expandable step cards showing "what to say" prompts, do/don't lists with green/red icons, collapsible rationale, and engagement progress bar
- Outcomes encrypted at rest via EncryptionService; questionnaire responses stored as structured JSONB

## Task Commits

Each task was committed atomically:

1. **Task 1: Create RTW meeting and guidance repositories, services, and guidance content** - `b7ba221` (feat)
2. **Task 2: Create RTW and guidance API routes with client actions** - `a838f6d` (feat)
3. **Task 3: Create RTW meeting form, questionnaire, and guidance panel UI** - `ed2df77` (feat)

## Files Created/Modified
- `providers/repositories/rtw-meeting.repository.ts` - CRUD for rtw_meetings table with dynamic update
- `providers/repositories/guidance.repository.ts` - Guidance engagement tracking CRUD
- `providers/services/rtw-meeting.service.ts` - Schedule/complete/cancel with WorkflowService integration
- `providers/services/guidance.service.ts` - State-based script selection with engagement tracking
- `constants/guidance-content.ts` - 5 guidance scripts (18 steps) with empathetic, UK-compliant content
- `app/api/sickness-cases/[id]/rtw-meeting/route.ts` - GET/POST/PATCH for RTW meeting CRUD
- `app/api/guidance/[caseId]/route.ts` - GET (script retrieval) and POST (engagement tracking)
- `actions/rtw-meetings.ts` - Client fetch wrappers for RTW meeting endpoints
- `actions/guidance.ts` - Client fetch wrappers for guidance endpoints
- `components/rtw-meeting-form/index.tsx` - Scheduling form, meeting details, cancel, completed summary
- `components/rtw-questionnaire/index.tsx` - 5-section questionnaire with adjustment builder
- `components/guidance-panel/index.tsx` - Expandable guidance steps with engagement tracking
- `app/(authenticated)/sickness/[id]/rtw/page.tsx` - Two-column RTW page with guidance sidebar

## Decisions Made
- Guidance scripts cover 5 type/absenceType combinations with fallback to "general" for non-specific types
- Case state maps to guidance type: REPORTED/TRACKING -> initial_contact, FIT_NOTE_RECEIVED -> check_in, RTW_SCHEDULED+ -> rtw_meeting
- Outcomes encrypted (sensitive), questionnaire responses stored as JSONB (structured but non-diagnostic)
- Meeting cancellation does not trigger state transition -- allows rescheduling without state machine complications

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- RTW workflow complete: schedule -> questionnaire -> complete -> close case pathway functional
- Guidance scripts available for all case lifecycle stages
- Ready for notification/communication features (Plan 05)
- Case detail page can link to /sickness/[id]/rtw for RTW workflow

## Self-Check: PASSED

- All 13 created files verified on disk
- All 3 task commits (b7ba221, a838f6d, ed2df77) verified in git log
- TypeScript compiles cleanly with `npx tsc --noEmit`

---
*Phase: 02-sickness-lifecycle*
*Completed: 2026-02-15*
