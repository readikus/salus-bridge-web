---
phase: 02-sickness-lifecycle
plan: 05
subsystem: notifications, ui
tags: [sendgrid, react-email, email-templates, calendar, cron, privacy-validation]

# Dependency graph
requires:
  - phase: 02-02
    provides: "Sickness case CRUD and state machine"
  - phase: 02-03
    provides: "Fit note management and expiry cron endpoint"
  - phase: 02-04
    provides: "RTW meeting scheduling and completion"
provides:
  - "NotificationService with SendGrid email dispatch and privacy validation"
  - "Three React Email templates (sickness-reported, fit-note-expiring, rtw-meeting-scheduled)"
  - "Absence calendar page with month-view grid and mobile list fallback"
  - "Dashboard absence count cards for all roles"
  - "Fit note expiry cron with notification integration"
affects: [phase-03, notifications, reporting]

# Tech tracking
tech-stack:
  added: ["@sendgrid/mail", "@react-email/components", "react-email"]
  patterns: ["fire-and-forget notifications", "privacy-validated email dispatch", "CSS grid calendar"]

key-files:
  created:
    - "providers/services/notification.service.ts"
    - "emails/layout.tsx"
    - "emails/sickness-reported.tsx"
    - "emails/fit-note-expiring.tsx"
    - "emails/rtw-meeting-scheduled.tsx"
    - "components/absence-calendar/index.tsx"
    - "app/(authenticated)/calendar/page.tsx"
  modified:
    - "providers/services/sickness-case.service.ts"
    - "providers/services/rtw-meeting.service.ts"
    - "app/api/cron/fit-note-expiry/route.ts"
    - "app/(authenticated)/dashboard/page.tsx"
    - "components/sidebar/nav-items.ts"
    - "providers/repositories/sickness-case.repository.ts"
    - "providers/repositories/employee.repository.ts"
    - "providers/repositories/user-role.repository.ts"
    - "actions/sickness-cases.ts"
    - "app/api/sickness-cases/route.ts"

key-decisions:
  - "No notification repository -- audit logging via AuditLogService with AuditEntity.NOTIFICATION"
  - "Fire-and-forget pattern: notification failures caught and logged, never block workflow transitions"
  - "Privacy-safe calendar names: first name + last initial only"
  - "CSS grid calendar built with Tailwind (no external calendar library)"
  - "Date range filtering on sickness cases API uses overlap logic for calendar queries"

patterns-established:
  - "NotificationService.send validates all content against NOTIFICATION_FORBIDDEN_PATTERNS before dispatch"
  - "React Email templates with shared EmailLayout component for consistent branding"
  - "Fire-and-forget notification pattern: try/catch around all notification calls in services"
  - "EmployeeRepository.getManagerInfo for manager email lookup from employee ID"
  - "UserRoleRepository.findUsersByRole for role-based user discovery"

# Metrics
duration: 22min
completed: 2026-02-15
---

# Phase 2 Plan 5: Notifications, Calendar & Dashboard Summary

**Privacy-validated email notifications via SendGrid with React Email templates, month-view absence calendar, and live dashboard absence counts**

## Performance

- **Duration:** 22 min
- **Started:** 2026-02-15T23:08:36Z
- **Completed:** 2026-02-15T23:30:44Z
- **Tasks:** 2
- **Files modified:** 20

## Accomplishments
- NotificationService with COMP-03 privacy validation before every email send
- Three email templates (sickness-reported, fit-note-expiring, rtw-meeting-scheduled) with zero health details
- Fit note expiry cron sends notifications to manager and HR contacts with deduplication
- Absence calendar with CSS grid month view, status colour coding, and mobile list fallback
- Dashboard cards show live active absence counts for EMPLOYEE, MANAGER, HR, and ORG_ADMIN roles
- Sickness case API now supports date range filtering for calendar queries

## Task Commits

Each task was committed atomically:

1. **Task 1: Notification service, email templates, and workflow integration** - `433cfa7` (feat)
2. **Task 2: Fit note expiry cron, absence calendar, and dashboard** - `cc4f26a` (feat)

## Files Created/Modified
- `providers/services/notification.service.ts` - Email dispatch with privacy validation and SendGrid
- `emails/layout.tsx` - Shared email layout with SalusBridge branding
- `emails/sickness-reported.tsx` - NOTF-01: Manager notification on sickness report
- `emails/fit-note-expiring.tsx` - NOTF-02: Fit note expiry alert
- `emails/rtw-meeting-scheduled.tsx` - NOTF-03: RTW meeting notification to employee
- `components/absence-calendar/index.tsx` - Month-view calendar with status colours
- `app/(authenticated)/calendar/page.tsx` - Server component with role-based case fetching
- `app/api/cron/fit-note-expiry/route.ts` - Now sends notifications to manager + HR
- `app/(authenticated)/dashboard/page.tsx` - Live absence count cards for all roles
- `components/sidebar/nav-items.ts` - Added Absence Calendar nav item
- `providers/services/sickness-case.service.ts` - Fire-and-forget NOTF-01 on case creation
- `providers/services/rtw-meeting.service.ts` - Fire-and-forget NOTF-03 on RTW scheduling
- `providers/repositories/employee.repository.ts` - Added getManagerInfo method
- `providers/repositories/user-role.repository.ts` - Added findUsersByRole method
- `providers/repositories/sickness-case.repository.ts` - Added date range filter support
- `actions/sickness-cases.ts` - Added fetchAbsenceCalendar action
- `app/api/sickness-cases/route.ts` - Added startDateFrom/startDateTo query params
- `.env.example` - Added SENDGRID_API_KEY, SENDGRID_FROM_EMAIL, CRON_SECRET, NEXT_PUBLIC_APP_URL

## Decisions Made
- No notification table or repository -- sends are logged via AuditLogService with AuditEntity.NOTIFICATION and AuditAction.SEND
- Fire-and-forget pattern for all notification dispatch -- failures caught and logged but never block workflow transitions
- Calendar shows first name + last initial only for privacy (not full employee names)
- Built CSS grid calendar with Tailwind rather than importing a heavy calendar library
- Date range filtering uses overlap logic: absence_start_date <= endOfRange AND (absence_end_date >= startOfRange OR NULL)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added EmployeeRepository.getManagerInfo**
- **Found during:** Task 1 (notification integration)
- **Issue:** No existing method to look up a manager's email/userId from an employee ID
- **Fix:** Added getManagerInfo with JOIN through employees -> managers -> users
- **Files modified:** providers/repositories/employee.repository.ts
- **Committed in:** 433cfa7

**2. [Rule 2 - Missing Critical] Added UserRoleRepository.findUsersByRole**
- **Found during:** Task 2 (cron notification recipients)
- **Issue:** No method to find all users with HR role in an organisation for notification dispatch
- **Fix:** Added findUsersByRole with JOIN through user_roles -> users
- **Files modified:** providers/repositories/user-role.repository.ts
- **Committed in:** 433cfa7

---

**Total deviations:** 2 auto-fixed (2 missing critical functionality)
**Impact on plan:** Both additions were necessary for notification dispatch to work. No scope creep.

## Issues Encountered
None

## User Setup Required

SendGrid requires manual configuration for email delivery:
- `SENDGRID_API_KEY` - Create in SendGrid Dashboard -> Settings -> API Keys
- `SENDGRID_FROM_EMAIL` - Verified sender email in SendGrid
- `CRON_SECRET` - Any secure random string for cron endpoint authentication
- `NEXT_PUBLIC_APP_URL` - Application URL for email links

Without SENDGRID_API_KEY, notifications are silently skipped (warning logged).

## Next Phase Readiness
- Phase 2 sickness lifecycle is now feature-complete
- All NOTF requirements delivered (NOTF-01/02/03)
- SICK-06 absence calendar delivered
- Dashboard integration complete for all roles
- Ready for Phase 3 or milestone audit

## Self-Check: PASSED

All 11 key files verified present. Both task commits (433cfa7, cc4f26a) verified in git log.

---
*Phase: 02-sickness-lifecycle*
*Completed: 2026-02-15*
