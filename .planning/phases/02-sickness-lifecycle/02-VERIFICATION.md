---
phase: 02-sickness-lifecycle
verified: 2026-02-15T23:55:00Z
status: passed
score: 5/5 success criteria verified
---

# Phase 2: Sickness Lifecycle Verification Report

**Phase Goal:** An employee can report sickness and be guided through a complete return-to-work cycle -- with their manager receiving structured, empathetic guidance at every step
**Verified:** 2026-02-15T23:55:00Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Employee can report sickness (or manager on behalf) with absence type, dates, notes; case follows validated state machine REPORTED through CLOSED | VERIFIED | `SicknessReportForm` component with Zod-validated form (absence type, dates, notes), `isManagerReporting` prop with employee dropdown, POST `/api/sickness-cases` with role-based access (employee self-report, manager team report, HR/admin any). State machine in `constants/sickness-states.ts` with VALID_TRANSITIONS map, enforced by `WorkflowService.transition()` which validates current state against allowed actions before updating. |
| 2 | Fit notes uploaded, stored with signed URLs, expiry tracked, access restricted (HR/employee only, not managers) | VERIFIED | `StorageService` uploads to private Supabase bucket with content type/size validation. `FitNoteService.getSignedDownloadUrl()` generates 5-minute signed URLs. `FitNoteService.assertNotManager()` explicitly blocks MANAGER role. Cron endpoint at `/api/cron/fit-note-expiry` queries expiring notes within configurable days. |
| 3 | RTW meeting can be scheduled, questionnaire completed, outcomes/adjustments recorded, case closed | VERIFIED | `RtwMeetingService.schedule()` creates meeting + triggers SCHEDULE_RTW transition. `RtwQuestionnaire` component captures 5-question structured questionnaire, outcomes text, and adjustable workplace adjustments with review dates. `RtwMeetingService.complete()` encrypts outcomes, stores adjustments, triggers COMPLETE_RTW transition. CLOSE_CASE action available after RTW_COMPLETED state. |
| 4 | Manager receives contextual, empathetic guidance at key workflow moments | VERIFIED | `constants/guidance-content.ts` contains 5 full scripts (440 lines) covering initial_contact (mental_health, musculoskeletal, general), check_in (general), and rtw_meeting (general). Each script has multi-step guidance with prompt text, rationale, do/don't lists. `GuidanceService` matches script by case state and absence type with general fallback. `GuidancePanel` component renders step-by-step UI with engagement tracking, wired into RTW page layout. |
| 5 | Notifications sent at workflow steps without health details exposed | VERIFIED | `NotificationService.send()` calls `validateNotificationPayload()` before every dispatch, checking against 11 forbidden patterns (diagnosis, condition, illness, symptom, etc.). Email templates (`sickness-reported.tsx`, `fit-note-expiring.tsx`, `rtw-meeting-scheduled.tsx`) use generic language only -- no employee names, no absence types, no conditions. SendGrid integration with graceful skip when API key not configured. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `database/migrations/20260215000001_create_sickness_cases.ts` | Sickness cases + case transitions tables | VERIFIED | CREATE TABLE with all columns, indexes on org_id, employee_id, status |
| `database/migrations/20260215000002_create_fit_notes.ts` | Fit notes table | VERIFIED | File exists (46 lines) |
| `database/migrations/20260215000003_create_rtw_meetings.ts` | RTW meetings table | VERIFIED | File exists |
| `database/migrations/20260215000004_create_guidance_engagement.ts` | Guidance engagement tracking | VERIFIED | File exists |
| `database/migrations/20260215000005_enable_rls_phase2.ts` | RLS policies for Phase 2 tables | VERIFIED | File exists |
| `constants/sickness-states.ts` | State machine with VALID_TRANSITIONS | VERIFIED | 59 lines, SicknessState enum (6 states), SicknessAction enum (6 actions), VALID_TRANSITIONS map, FitNoteStatus, FunctionalEffect, RtwMeetingStatus |
| `constants/absence-types.ts` | Absence type enum and labels | VERIFIED | File exists |
| `constants/guidance-content.ts` | Scripted guidance content | VERIFIED | 440 lines, 5 GuidanceScript objects with GuidanceStep arrays, do/don't lists |
| `constants/notification-privacy.ts` | Privacy validation | VERIFIED | 132 lines, NOTIFICATION_FORBIDDEN_PATTERNS (11 regex), validateNotificationPayload(), sanitizeNotificationContent() |
| `providers/services/workflow.service.ts` | State machine execution | VERIFIED | 150 lines, transition() validates against VALID_TRANSITIONS, creates transition records, audit logs, long-term threshold check |
| `providers/services/sickness-case.service.ts` | Case CRUD | VERIFIED | 193 lines, create with encryption + working days calc + notification, getById with decryption, filters, manager team query |
| `providers/services/working-days.service.ts` | UK bank holiday calculation | VERIFIED | 110 lines, GOV.UK API with 24h cache, 2026 fallback data, weekend + bank holiday exclusion |
| `providers/services/fit-note.service.ts` | Fit note management | VERIFIED | 208 lines, upload with state transition, role-based access control blocking managers, signed URL generation, expiry query |
| `providers/services/storage.service.ts` | Supabase Storage operations | VERIFIED | 78 lines, upload with content type + size validation, signed URL (5 min expiry), delete |
| `providers/services/rtw-meeting.service.ts` | RTW meeting workflow | VERIFIED | 208 lines, schedule + SCHEDULE_RTW transition + employee notification, complete + COMPLETE_RTW transition + encryption, cancel |
| `providers/services/guidance.service.ts` | Guidance retrieval + tracking | VERIFIED | 110 lines, state-to-guidance-type mapping, absence type matching with fallback, engagement tracking |
| `providers/services/notification.service.ts` | Email dispatch with privacy | VERIFIED | 180 lines, privacy validation before send, SendGrid integration, 3 notification methods with React Email rendering |
| `providers/repositories/sickness-case.repository.ts` | Data access | VERIFIED | File exists |
| `providers/repositories/case-transition.repository.ts` | Transition records | VERIFIED | File exists |
| `providers/repositories/fit-note.repository.ts` | Fit note data access | VERIFIED | File exists |
| `providers/repositories/rtw-meeting.repository.ts` | RTW meeting data access | VERIFIED | File exists |
| `providers/repositories/guidance.repository.ts` | Guidance engagement data access | VERIFIED | File exists |
| `app/api/sickness-cases/route.ts` | List + create cases | VERIFIED | 163 lines, GET with role-based filtering (employee own, manager team, HR all), POST with role-based reporting access |
| `app/api/sickness-cases/[id]/route.ts` | Case detail + update | VERIFIED | File exists |
| `app/api/sickness-cases/[id]/transition/route.ts` | State transition | VERIFIED | 108 lines, validates SicknessAction, permission check, calls WorkflowService.transition() |
| `app/api/sickness-cases/[id]/fit-notes/route.ts` | Fit note list + upload | VERIFIED | 150 lines, multipart form data parsing, manager access blocked |
| `app/api/sickness-cases/[id]/fit-notes/[fitNoteId]/download/route.ts` | Signed URL download | VERIFIED | File exists |
| `app/api/sickness-cases/[id]/rtw-meeting/route.ts` | RTW meeting CRUD | VERIFIED | 148 lines, GET/POST/PATCH, schedule + complete + cancel |
| `app/api/guidance/[caseId]/route.ts` | Guidance API | VERIFIED | 76 lines, GET guidance + POST engagement tracking |
| `app/api/cron/fit-note-expiry/route.ts` | Cron endpoint | VERIFIED | 107 lines, CRON_SECRET auth, expiring note query, notification dispatch to manager + HR |
| `app/(authenticated)/sickness/report/page.tsx` | Report form page | VERIFIED | 94 lines, role detection, employee dropdown for managers, SicknessReportForm integration |
| `app/(authenticated)/sickness/[id]/page.tsx` | Case detail page | VERIFIED | 77 lines, fetches case with transitions and available actions |
| `app/(authenticated)/sickness/history/page.tsx` | Absence history | VERIFIED | 70 lines, fetches cases, AbsenceHistory component, permission-gated report button |
| `app/(authenticated)/sickness/[id]/fit-notes/page.tsx` | Fit notes page | VERIFIED | 103 lines, manager access blocked with message, upload + list components |
| `app/(authenticated)/sickness/[id]/rtw/page.tsx` | RTW page with guidance | VERIFIED | 116 lines, two-column layout with RTW form/questionnaire + GuidancePanel sidebar |
| `app/(authenticated)/calendar/page.tsx` | Absence calendar | VERIFIED | 99 lines, server component with role-based case filtering, AbsenceCalendar component |
| `components/sickness-report-form/index.tsx` | Report form | VERIFIED | 173 lines, react-hook-form with Zod resolver, absence type dropdown, date pickers, notes, fetchCreateSicknessCase action |
| `components/sickness-case-detail/index.tsx` | Case detail | VERIFIED | 222 lines, status badge, case summary, available actions with modal, transition timeline |
| `components/absence-history/index.tsx` | History list | VERIFIED | File exists |
| `components/fit-note-upload/index.tsx` | Upload form | VERIFIED | File exists |
| `components/fit-note-list/index.tsx` | Fit note list | VERIFIED | File exists |
| `components/rtw-meeting-form/index.tsx` | Meeting form | VERIFIED | File exists |
| `components/rtw-questionnaire/index.tsx` | Structured questionnaire | VERIFIED | 327 lines, 5-question form, adjustment checklist (phased return, altered hours, amended duties, adapted workplace), outcomes, adjustments with review dates |
| `components/guidance-panel/index.tsx` | Step-by-step guidance | VERIFIED | 276 lines, fetches guidance, expandable steps with prompts/rationale/do-dont lists, engagement tracking, progress bar |
| `components/absence-calendar/index.tsx` | Month calendar grid | VERIFIED | 212 lines, desktop grid + mobile list view, status colour coding, month navigation, privacy-safe names |
| `emails/sickness-reported.tsx` | Notification template | VERIFIED | 67 lines, generic subject ("A team member has reported an absence"), no employee name/condition |
| `emails/fit-note-expiring.tsx` | Expiry alert template | VERIFIED | File exists |
| `emails/rtw-meeting-scheduled.tsx` | RTW notification template | VERIFIED | File exists |
| `actions/sickness-cases.ts` | Client action wrappers | VERIFIED | 141 lines, fetchSicknessCases, fetchSicknessCase, fetchCreateSicknessCase, fetchTransitionCase, fetchAbsenceCalendar |
| `actions/fit-notes.ts` | Fit note actions | VERIFIED | File exists |
| `actions/rtw-meetings.ts` | RTW meeting actions | VERIFIED | File exists |
| `actions/guidance.ts` | Guidance actions | VERIFIED | File exists |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `workflow.service.ts` | `constants/sickness-states.ts` | VALID_TRANSITIONS import | WIRED | Line 1: `import { SicknessState, SicknessAction, VALID_TRANSITIONS }` |
| `app/api/.../transition/route.ts` | `workflow.service.ts` | WorkflowService.transition() | WIRED | Line 89: `WorkflowService.transition(id, action, ...)` |
| `sickness-report-form/index.tsx` | `app/api/sickness-cases/route.ts` | fetchCreateSicknessCase action | WIRED | Form calls `fetchCreateSicknessCase(cleanData)` which POSTs to `/api/sickness-cases` |
| `fit-note.service.ts` | `workflow.service.ts` | RECEIVE_FIT_NOTE transition | WIRED | Line 70: `WorkflowService.transition(caseId, SicknessAction.RECEIVE_FIT_NOTE, ...)` |
| `storage.service.ts` | `providers/supabase/client.ts` | createServerClient | WIRED | Line 1: `import { createServerClient }` |
| `fit-notes/.../download/route.ts` | `storage.service.ts` | StorageService.getSignedUrl | WIRED | File exists, calls StorageService |
| `rtw-meeting.service.ts` | `workflow.service.ts` | SCHEDULE_RTW + COMPLETE_RTW transitions | WIRED | Line 53: `WorkflowService.transition(...SCHEDULE_RTW)`, Line 135: `...COMPLETE_RTW` |
| `guidance.service.ts` | `constants/guidance-content.ts` | GUIDANCE_SCRIPTS import | WIRED | Line 5: `import { GUIDANCE_SCRIPTS, GuidanceScript }` |
| `guidance-panel/index.tsx` | `actions/guidance.ts` | fetchGuidance + fetchTrackEngagement | WIRED | Line 5: `import { fetchGuidance, fetchTrackEngagement }` |
| `notification.service.ts` | `constants/notification-privacy.ts` | validateNotificationPayload | WIRED | Line 3: `import { validateNotificationPayload }`, Line 32: `validateNotificationPayload({...})` |
| `cron/fit-note-expiry/route.ts` | `notification.service.ts` | NotificationService.notifyFitNoteExpiring | WIRED | Line 70: `NotificationService.notifyFitNoteExpiring(...)` |
| `notification.service.ts` | `emails/*.tsx` | React Email render | WIRED | Lines 6-8: imports all 3 templates, Lines 87, 122, 159: `render()` calls |
| `sickness-case.service.ts` | `notification.service.ts` | notifySicknessReported | WIRED | Line 82: `NotificationService.notifySicknessReported(...)` |
| `rtw-meeting.service.ts` | `notification.service.ts` | notifyRtwScheduled | WIRED | Line 75: `NotificationService.notifyRtwScheduled(...)` |
| Sidebar nav | Sickness pages | href links | WIRED | nav-items.ts contains "Report Sickness" (/sickness/report), "Absence Calendar" (/calendar), "Absence History" (/sickness/history) |
| Dashboard | SicknessCaseService | Active absences count | WIRED | Dashboard imports SicknessCaseService, queries active cases for admin/manager/employee views |

### Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| SICK-01: Employee self-report | SATISFIED | SicknessReportForm with self-reporting path |
| SICK-02: Manager report on behalf | SATISFIED | isManagerReporting prop, team validation in API |
| SICK-03: Absence type capture | SATISFIED | AbsenceType enum, dropdown in form |
| SICK-04: Working days calculation | SATISFIED | WorkingDaysService with UK bank holidays |
| SICK-05: State machine lifecycle | SATISFIED | VALID_TRANSITIONS, WorkflowService enforcement |
| SICK-06: Absence calendar | SATISFIED | AbsenceCalendar component, /calendar page |
| WRKF-01: State machine transitions | SATISFIED | 6 states, 6 actions, validation in WorkflowService |
| WRKF-02: Transition logging | SATISFIED | CaseTransitionRepository.create() with from/to/actor/notes |
| WRKF-03: Available actions | SATISFIED | WorkflowService.getAvailableActions(), exposed in API |
| WRKF-04: Long-term threshold | SATISFIED | checkLongTermThreshold() in WorkflowService |
| FIT-01: Upload fit notes | SATISFIED | FitNoteService.upload(), multipart form handling |
| FIT-02: Metadata capture | SATISFIED | fitNoteStatus, dates, functionalEffects in schema |
| FIT-03: Expiry tracking | SATISFIED | Cron endpoint, findExpiringWithinDays query |
| FIT-04: Access control (no managers) | SATISFIED | assertNotManager() in FitNoteService, UI blocking in fit-notes page |
| RTW-01: Schedule meeting | SATISFIED | RtwMeetingService.schedule() with SCHEDULE_RTW transition |
| RTW-02: Structured questionnaire | SATISFIED | RtwQuestionnaire with 5 questions + adjustments |
| RTW-03: Outcomes/adjustments | SATISFIED | complete() stores encrypted outcomes + adjustments array |
| RTW-04: Case closure | SATISFIED | CLOSE_CASE action available after RTW_COMPLETED |
| GUID-01: Contextual guidance | SATISFIED | State-to-type mapping, absence-type matching |
| GUID-02: Scripted content | SATISFIED | 5 scripts with prompts, rationale, do/don't lists |
| GUID-03: Step-by-step prompts | SATISFIED | GuidancePanel with expandable steps |
| GUID-04: Engagement tracking | SATISFIED | GuidanceRepository.createEngagement() |
| NOTF-01: Sickness reported notification | SATISFIED | notifySicknessReported() with generic content |
| NOTF-02: Fit note expiry notification | SATISFIED | notifyFitNoteExpiring() via cron |
| NOTF-03: RTW scheduled notification | SATISFIED | notifyRtwScheduled() in RtwMeetingService |
| NOTF-04: Privacy validation | SATISFIED | validateNotificationPayload() with 11 forbidden patterns |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `components/sickness-case-detail/index.tsx` | 145-147 | Stale placeholder text: "Manager guidance prompts will be available in a future update" | Warning | Misleading UI text -- guidance IS available on the RTW page. Does not block functionality but is inaccurate copy that should be removed or updated with a link to the RTW page guidance. |

### Human Verification Required

### 1. End-to-End Sickness Reporting Flow
**Test:** Log in as employee, navigate to /sickness/report, fill form, submit. Then log in as manager of that employee.
**Expected:** Case appears in both user's absence history. Manager dashboard shows active absence count incremented.
**Why human:** Requires running app with database, multiple user sessions, and auth context.

### 2. State Machine Transition UI
**Test:** As manager, open a REPORTED case. Click Acknowledge. Verify status changes to TRACKING. Continue through SCHEDULE_RTW, COMPLETE_RTW, CLOSE_CASE.
**Expected:** Each transition updates the status badge, adds to timeline, and shows correct next available actions.
**Why human:** Requires interactive UI testing with state persistence.

### 3. Fit Note Upload and Manager Blocking
**Test:** As employee, upload a fit note PDF on /sickness/[id]/fit-notes. Then switch to manager role and navigate to the same page.
**Expected:** Employee sees upload form and can download via signed URL. Manager sees "Managers do not have access" message.
**Why human:** Requires file upload, Supabase Storage integration, role-based rendering.

### 4. Guidance Panel Rendering and Engagement
**Test:** As manager, navigate to /sickness/[id]/rtw. Expand guidance steps, mark as reviewed.
**Expected:** Script content appears with prompts, do/don't lists. Progress bar updates. Engagement persists on reload.
**Why human:** Visual rendering, interactive state, persistence verification.

### 5. Email Notification Content
**Test:** Trigger sickness reporting, fit note expiry cron, and RTW scheduling. Inspect sent emails.
**Expected:** All emails use generic language. No employee names, absence types, or conditions in subject or body.
**Why human:** Requires SendGrid integration, email content inspection.

### 6. Calendar View
**Test:** As manager, navigate to /calendar with active team absences.
**Expected:** Month grid shows colour-coded absence bars for team members. Click navigates to case detail.
**Why human:** Visual layout, date arithmetic, responsive design.

### Gaps Summary

No blocking gaps found. All 5 success criteria are verified at the code level:

1. **Sickness reporting** -- complete with employee self-report and manager-on-behalf flows, validated state machine with 6 states and 6 actions.
2. **Fit notes** -- upload to private Supabase Storage, signed URLs, manager access explicitly blocked, expiry cron endpoint.
3. **RTW meetings** -- scheduling with state transition, 5-question structured questionnaire, outcomes encryption, adjustments with review dates.
4. **Manager guidance** -- 5 scripted scenarios (440 lines of empathetic content), state-aware matching, engagement tracking, step-by-step UI with progress.
5. **Notifications** -- 3 email templates with privacy validation (11 forbidden patterns), generic language throughout.

One minor warning: stale placeholder text in sickness-case-detail component (line 145) says guidance is "coming in a future update" when it already exists on the RTW page. This is cosmetic only.

---

_Verified: 2026-02-15T23:55:00Z_
_Verifier: Claude (gsd-verifier)_
