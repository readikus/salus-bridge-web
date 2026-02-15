# Phase 2: Sickness Lifecycle - Research

**Researched:** 2026-02-15
**Domain:** Sickness absence management, state machine workflows, health data handling, document storage, notifications
**Confidence:** HIGH

## Summary

Phase 2 builds the core sickness lifecycle on top of Phase 1's foundation (auth, RBAC, audit logging, encryption, RLS, employee management). The phase spans six technical domains: (1) sickness case reporting and state machine workflow, (2) working day calculations with UK bank holidays, (3) fit note document upload and secure storage via Supabase Storage, (4) return-to-work meeting scheduling and structured questionnaires, (5) manager conversation guidance system, and (6) privacy-safe notifications via SendGrid + React Email.

The existing codebase already provides critical infrastructure: `TenantService.withTenant()` for RLS-scoped transactions, `EncryptionService` for AES-256-GCM field-level encryption, `AuditLogService` for immutable audit logging (23 existing call sites), `notification-privacy.ts` scaffolding (COMP-03), and `OrgSettingsSchema` with preconfigured `absenceTriggerThresholds` (longTermDays: 28, shortTermDays: 3) and notification preferences. The employees table already has `manager_id` with recursive CTE queries for reporting chains.

**Primary recommendation:** Use a hand-rolled state machine (transition map + validation function) rather than xstate -- it fits the existing service/repository pattern, avoids a heavy dependency, and the workflow has ~8 states with deterministic transitions. Use Supabase Storage private bucket with server-generated signed URLs for fit notes. Use the GOV.UK bank holidays JSON API for working day calculations. Install `@sendgrid/mail` and `@react-email/components` for notifications.

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pg | ^8.13.1 | Database queries | Already used -- 44+ pool.query calls in Phase 1 |
| zod | ^3.24.2 | Schema validation | Already used for all form/API validation |
| react-hook-form | ^7.71.1 | Form management | Already used for employee/org forms |
| @supabase/supabase-js | ^2.95.3 | Supabase Storage client | Already installed -- used for auth, now also for file storage |
| @supabase/ssr | ^0.8.0 | Server-side Supabase client | Already installed for auth |

### New Dependencies to Install
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @sendgrid/mail | ^8.x | Email delivery | Notification dispatch (NOTF-01 through NOTF-04) |
| @react-email/components | ^0.x | Email templates | Composing HTML email bodies |
| react-email | ^3.x | Email preview dev server | Development-time template preview (devDependency) |
| date-fns | ^4.x | Date arithmetic | Working day calculation, date formatting, interval computation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled state machine | xstate v5 | xstate adds ~50KB and actor model complexity; our workflow is linear with ~8 states -- a transition map in 30 lines is sufficient and matches the service pattern |
| date-fns | dayjs / moment-business-days | date-fns is tree-shakeable and has no mutable state; moment is deprecated; dayjs-business-days has small community |
| GOV.UK bank holidays API | date-holidays npm | GOV.UK is the authoritative UK government source with zero dependencies; date-holidays bundles data for 120+ countries unnecessarily |
| SendGrid | Resend / AWS SES | SendGrid is already specified in CLAUDE.md; Resend has simpler DX but SendGrid is the project standard |

**Installation:**
```bash
yarn add @sendgrid/mail @react-email/components date-fns
yarn add -D react-email
```

**Environment variables to add:**
```
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@salusbridge.com
```

## Architecture Patterns

### Recommended Project Structure (new files for Phase 2)
```
database/migrations/
  ├── 20260215000001_create_sickness_cases.ts
  ├── 20260215000002_create_case_transitions.ts
  ├── 20260215000003_create_fit_notes.ts
  ├── 20260215000004_create_rtw_meetings.ts
  ├── 20260215000005_create_guidance_engagement.ts
  ├── 20260215000006_create_notifications.ts
  └── 20260215000007_enable_rls_phase2.ts

providers/
  ├── repositories/
  │   ├── sickness-case.repository.ts
  │   ├── case-transition.repository.ts
  │   ├── fit-note.repository.ts
  │   ├── rtw-meeting.repository.ts
  │   ├── guidance.repository.ts
  │   └── notification.repository.ts
  └── services/
      ├── sickness-case.service.ts      # Case CRUD + state machine
      ├── workflow.service.ts            # State transitions + side effects
      ├── fit-note.service.ts            # Upload, metadata, expiry tracking
      ├── storage.service.ts             # Supabase Storage signed URLs
      ├── rtw-meeting.service.ts         # RTW scheduling + questionnaire
      ├── guidance.service.ts            # Manager conversation guidance
      ├── notification.service.ts        # Email dispatch via SendGrid
      └── working-days.service.ts        # UK bank holiday + working day calc

schemas/
  ├── sickness-case.ts
  ├── fit-note.ts
  ├── rtw-meeting.ts
  └── guidance.ts

emails/
  ├── sickness-reported.tsx
  ├── fit-note-expiring.tsx
  ├── rtw-meeting-scheduled.tsx
  └── layout.tsx

constants/
  ├── absence-types.ts                  # SICK-03 categories
  ├── sickness-states.ts                # WRKF-01 state machine definition
  └── guidance-content.ts               # GUID-01/03 scripted guidance text

app/api/
  ├── sickness-cases/
  │   ├── route.ts                      # GET (list), POST (create)
  │   └── [id]/
  │       ├── route.ts                  # GET (detail), PATCH (update)
  │       ├── transition/route.ts       # POST (state transition)
  │       ├── fit-notes/route.ts        # GET (list), POST (upload)
  │       └── rtw-meeting/route.ts      # GET, POST, PATCH
  └── guidance/
      └── [caseId]/route.ts             # GET (guidance for case)

app/(authenticated)/
  ├── sickness/
  │   ├── report/page.tsx               # SICK-01/02 report form
  │   ├── [id]/page.tsx                 # Case detail view
  │   ├── [id]/fit-notes/page.tsx       # FIT-01/02 fit note management
  │   ├── [id]/rtw/page.tsx             # RTW-01/02/03 meeting form
  │   └── history/page.tsx              # SICK-05 absence history
  ├── calendar/page.tsx                 # SICK-06 absence calendar
  └── dashboard/page.tsx                # Updated with active absences
```

### Pattern 1: State Machine as Transition Map
**What:** Define valid state transitions as a static Record, validate in WorkflowService before any mutation.
**When to use:** All sickness case state changes (WRKF-01, WRKF-02).
**Source:** Codebase convention from .planning/research/ARCHITECTURE.md

```typescript
// constants/sickness-states.ts
export enum SicknessState {
  REPORTED = "REPORTED",
  TRACKING = "TRACKING",
  FIT_NOTE_RECEIVED = "FIT_NOTE_RECEIVED",
  RTW_SCHEDULED = "RTW_SCHEDULED",
  RTW_COMPLETED = "RTW_COMPLETED",
  CLOSED = "CLOSED",
}

export enum SicknessAction {
  ACKNOWLEDGE = "acknowledge",
  RECEIVE_FIT_NOTE = "receive_fit_note",
  SCHEDULE_RTW = "schedule_rtw",
  COMPLETE_RTW = "complete_rtw",
  CLOSE_CASE = "close_case",
  REOPEN = "reopen",
}

export const VALID_TRANSITIONS: Record<SicknessState, Partial<Record<SicknessAction, SicknessState>>> = {
  [SicknessState.REPORTED]: {
    [SicknessAction.ACKNOWLEDGE]: SicknessState.TRACKING,
  },
  [SicknessState.TRACKING]: {
    [SicknessAction.RECEIVE_FIT_NOTE]: SicknessState.FIT_NOTE_RECEIVED,
    [SicknessAction.SCHEDULE_RTW]: SicknessState.RTW_SCHEDULED,
  },
  [SicknessState.FIT_NOTE_RECEIVED]: {
    [SicknessAction.SCHEDULE_RTW]: SicknessState.RTW_SCHEDULED,
    [SicknessAction.RECEIVE_FIT_NOTE]: SicknessState.FIT_NOTE_RECEIVED, // replacement fit note
  },
  [SicknessState.RTW_SCHEDULED]: {
    [SicknessAction.COMPLETE_RTW]: SicknessState.RTW_COMPLETED,
  },
  [SicknessState.RTW_COMPLETED]: {
    [SicknessAction.CLOSE_CASE]: SicknessState.CLOSED,
  },
  [SicknessState.CLOSED]: {
    [SicknessAction.REOPEN]: SicknessState.TRACKING,
  },
};
```

### Pattern 2: Workflow Transition with Audit + Side Effects
**What:** Single entry point for all state changes. Validates, mutates, logs, triggers notifications.
**When to use:** Every time a sickness case changes state.

```typescript
// providers/services/workflow.service.ts
export class WorkflowService {
  static async transition(
    caseId: string,
    action: SicknessAction,
    userId: string,
    organisationId: string,
    notes?: string,
  ): Promise<SicknessCase> {
    return TenantService.withTenant(organisationId, false, async (client) => {
      const currentCase = await SicknessCaseRepository.findById(caseId, client);
      if (!currentCase) throw new Error("Case not found");

      const validActions = VALID_TRANSITIONS[currentCase.status as SicknessState];
      const newStatus = validActions?.[action];
      if (!newStatus) {
        throw new Error(`Cannot ${action} from ${currentCase.status}`);
      }

      // Update case status
      const updated = await SicknessCaseRepository.updateStatus(caseId, newStatus, client);

      // Log transition (WRKF-03)
      await CaseTransitionRepository.create({
        caseId,
        fromStatus: currentCase.status,
        toStatus: newStatus,
        action,
        performedBy: userId,
        notes,
      }, client);

      // Audit log
      await AuditLogService.log({
        userId,
        organisationId,
        action: AuditAction.UPDATE,
        entity: AuditEntity.SICKNESS_CASE, // new enum value
        entityId: caseId,
        metadata: { fromStatus: currentCase.status, toStatus: newStatus, action },
      });

      return updated;
    });
    // Side effects (notifications) dispatched AFTER transaction commits
  }
}
```

### Pattern 3: Secure Document Storage with Signed URLs
**What:** Upload fit notes to Supabase Storage private bucket, generate short-lived signed URLs for access.
**When to use:** FIT-01, FIT-04 fit note upload and access.

```typescript
// providers/services/storage.service.ts
import { createServerClient } from "@/providers/supabase/client";

const BUCKET_NAME = "fit-notes";
const SIGNED_URL_EXPIRY_SECONDS = 300; // 5 minutes

export class StorageService {
  static async upload(
    organisationId: string,
    caseId: string,
    fileName: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<string> {
    const supabase = await createServerClient();
    const storagePath = `${organisationId}/${caseId}/${Date.now()}-${fileName}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, { contentType, upsert: false });

    if (error) throw new Error(`Storage upload failed: ${error.message}`);
    return data.path;
  }

  static async getSignedUrl(storagePath: string): Promise<string> {
    const supabase = await createServerClient();
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_SECONDS);

    if (error) throw new Error(`Signed URL generation failed: ${error.message}`);
    return data.signedUrl;
  }
}
```

### Pattern 4: Privacy-Safe Notifications
**What:** Compose emails using React Email templates, validate with notification-privacy.ts before dispatch.
**When to use:** NOTF-01 through NOTF-04.

```typescript
// providers/services/notification.service.ts
import sgMail from "@sendgrid/mail";
import { validateNotificationPayload, sanitizeNotificationContent } from "@/constants/notification-privacy";

export class NotificationService {
  static async send(params: {
    to: string;
    subject: string;
    html: string;
    organisationId: string;
    notificationType: string;
  }): Promise<void> {
    // COMP-03: Validate no health details leak
    const validation = validateNotificationPayload({
      subject: params.subject,
      body: params.html,
    });
    if (!validation.valid) {
      throw new Error(`Notification privacy violation: ${validation.violations.join(", ")}`);
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
    await sgMail.send({
      to: params.to,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: params.subject,
      html: params.html,
    });
  }
}
```

### Pattern 5: Working Days Calculation with UK Bank Holidays
**What:** Calculate working days lost excluding weekends and UK bank holidays (SICK-04).
**When to use:** Absence duration display and reporting.

```typescript
// providers/services/working-days.service.ts
import { eachDayOfInterval, isWeekend, parseISO, format } from "date-fns";

const GOV_UK_BANK_HOLIDAYS_URL = "https://www.gov.uk/bank-holidays.json";

// Cache bank holidays for 24 hours
let bankHolidayCache: { dates: Set<string>; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export class WorkingDaysService {
  static async getBankHolidays(): Promise<Set<string>> {
    if (bankHolidayCache && Date.now() - bankHolidayCache.fetchedAt < CACHE_TTL_MS) {
      return bankHolidayCache.dates;
    }

    const response = await fetch(GOV_UK_BANK_HOLIDAYS_URL);
    const data = await response.json();
    const events = data["england-and-wales"].events;
    const dates = new Set<string>(events.map((e: { date: string }) => e.date));

    bankHolidayCache = { dates, fetchedAt: Date.now() };
    return dates;
  }

  static async calculateWorkingDaysLost(startDate: string, endDate: string): Promise<number> {
    const bankHolidays = await WorkingDaysService.getBankHolidays();
    const days = eachDayOfInterval({
      start: parseISO(startDate),
      end: parseISO(endDate),
    });

    return days.filter((day) => {
      if (isWeekend(day)) return false;
      if (bankHolidays.has(format(day, "yyyy-MM-dd"))) return false;
      return true;
    }).length;
  }
}
```

### Anti-Patterns to Avoid
- **Health data in notification content:** Notifications must NEVER include diagnosis, condition, employee name in subject. Use existing `notification-privacy.ts` validators BEFORE every send.
- **Manager access to fit note documents:** Managers see case status but NOT fit note PDFs. Fit notes are HR/employee-only (FIT-04). Enforce at API level with separate permission check.
- **Client-side state machine logic:** State transitions must happen server-side only. The UI shows current state and available actions, but validation is in WorkflowService.
- **Storing file content in PostgreSQL:** Fit note files go to Supabase Storage. Only metadata (filename, size, path, uploader, timestamps) stored in PostgreSQL.
- **Ad-hoc status updates bypassing WorkflowService:** Every state change must go through `WorkflowService.transition()` to ensure validation, audit logging, and notifications fire.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UK bank holiday data | Hardcoded holiday list | GOV.UK bank-holidays.json API | Government maintains it; updates automatically; includes substitute days |
| Date interval arithmetic | Manual day counting loops | date-fns `eachDayOfInterval`, `isWeekend`, `differenceInBusinessDays` | Edge cases with DST, leap years, timezone boundaries |
| Email HTML rendering | String concatenation | React Email components | Consistent rendering across email clients, maintainable templates |
| Signed URL generation | Custom token + expiry logic | Supabase Storage `createSignedUrl()` | Built into the storage SDK, handles expiry and bucket policies |
| File upload validation | Manual MIME type checking | Check both MIME type header and file extension | MIME types can be spoofed; validate both |

**Key insight:** The codebase already has most foundational services (audit, encryption, tenant isolation, RBAC). Phase 2's complexity is in orchestrating these existing services around a new domain model -- not in building new infrastructure.

## Common Pitfalls

### Pitfall 1: Health Data Exposed to Managers
**What goes wrong:** Manager API responses or UI components accidentally include diagnosis details, fit note content, or medical notes.
**Why it happens:** Single API response shape used for all roles; frontend filtering instead of backend.
**How to avoid:** Separate API response shapes per role. Manager view: case status, dates, actions available, guidance prompts. HR/employee view: full detail including fit notes.
**Warning signs:** A single GET /api/sickness-cases/[id] route returning all fields regardless of role.

### Pitfall 2: State Machine Bypass
**What goes wrong:** Direct database updates to `sickness_cases.status` bypassing `WorkflowService.transition()`. Results in missing audit entries, skipped notifications, invalid state transitions.
**Why it happens:** Developer convenience during testing or hotfixes.
**How to avoid:** Never expose `updateStatus` as a public repository method. All status changes go through WorkflowService. Add a database trigger or CHECK constraint validating allowed transitions.
**Warning signs:** Repository method named `updateStatus` that is public and callable from API routes directly.

### Pitfall 3: Fit Note Signed URLs Cached or Leaked
**What goes wrong:** Signed URLs with long expiry times get cached by browsers or proxies, or shared via email/chat.
**Why it happens:** Setting expiry too long for convenience; returning signed URLs in list responses.
**How to avoid:** 5-minute expiry maximum. Generate signed URLs only on explicit document access request (not in list views). Never include signed URLs in notification emails. Audit every signed URL generation.
**Warning signs:** Signed URLs in React Query cache with long TTL; fit note URLs visible in browser network tab after logout.

### Pitfall 4: Notification Privacy Violation
**What goes wrong:** Email subject or body includes employee name, diagnosis, or condition details.
**Why it happens:** Template includes dynamic fields that can contain health data; no validation before send.
**How to avoid:** Use `validateNotificationPayload()` from `notification-privacy.ts` before every send. Templates use generic language: "A team member has reported an absence" not "John Smith reported sick with depression".
**Warning signs:** Notification templates with `{employee.name}` or `{case.absenceType}` placeholders in subject line.

### Pitfall 5: Missing RLS on New Tables
**What goes wrong:** New tables (sickness_cases, fit_notes, rtw_meetings) created without RLS policies. Cross-tenant data leakage.
**Why it happens:** RLS policies are in a separate migration and can be forgotten.
**How to avoid:** Create RLS policies in the same migration batch as the tables. Follow the exact pattern from `20260214000005_enable_rls.ts`.
**Warning signs:** `SELECT * FROM sickness_cases` without `WHERE organisation_id =` returning cross-org data.

### Pitfall 6: Bank Holiday API Failure
**What goes wrong:** GOV.UK API is down or returns unexpected format. Working day calculation fails, blocking absence reporting.
**Why it happens:** External API dependency with no fallback.
**How to avoid:** Cache aggressively (24h TTL). Provide a static fallback of known UK bank holidays for the current and next year. Log failures but don't block the workflow -- show estimated working days with a note.
**Warning signs:** No try/catch around the bank holiday fetch; no cache; no fallback data.

## Code Examples

### Database Schema: Sickness Cases Table

```sql
-- Source: .planning/research/ARCHITECTURE.md (adapted to codebase conventions)
CREATE TABLE sickness_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES users(id),
  status VARCHAR(30) NOT NULL DEFAULT 'REPORTED',
  absence_type VARCHAR(50) NOT NULL,       -- SICK-03: musculoskeletal, mental_health, respiratory, surgical, other
  absence_start_date DATE NOT NULL,
  absence_end_date DATE,
  working_days_lost INTEGER,               -- SICK-04: calculated, cached
  notes_encrypted TEXT,                     -- Encrypted at app level
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sickness_cases_org ON sickness_cases(organisation_id);
CREATE INDEX idx_sickness_cases_employee ON sickness_cases(employee_id);
CREATE INDEX idx_sickness_cases_status ON sickness_cases(status);
```

### Database Schema: Fit Notes Table

```sql
CREATE TABLE fit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  sickness_case_id UUID NOT NULL REFERENCES sickness_cases(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  storage_path TEXT NOT NULL,              -- Supabase Storage path
  file_name VARCHAR(255) NOT NULL,
  file_size_bytes INTEGER,
  content_type VARCHAR(100),
  fit_note_status VARCHAR(20) NOT NULL,    -- FIT-02: 'NOT_FIT' or 'MAY_BE_FIT'
  start_date DATE NOT NULL,
  end_date DATE,                           -- FIT-03: expiry tracking
  functional_effects JSONB DEFAULT '[]',   -- FIT-02: phased_return, altered_hours, amended_duties, adapted_workplace
  notes_encrypted TEXT,                    -- Encrypted
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fit_notes_case ON fit_notes(sickness_case_id);
CREATE INDEX idx_fit_notes_expiry ON fit_notes(end_date) WHERE end_date IS NOT NULL;
```

### Database Schema: RTW Meetings Table

```sql
CREATE TABLE rtw_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  sickness_case_id UUID NOT NULL REFERENCES sickness_cases(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  scheduled_by UUID NOT NULL REFERENCES users(id),
  scheduled_date TIMESTAMPTZ NOT NULL,
  completed_date TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED', -- SCHEDULED, COMPLETED, CANCELLED
  questionnaire_responses JSONB,           -- RTW-02: structured questionnaire answers
  outcomes_encrypted TEXT,                 -- RTW-03: encrypted meeting outcomes
  adjustments JSONB DEFAULT '[]',          -- RTW-03: agreed workplace adjustments
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Database Schema: Case Transitions Table

```sql
-- WRKF-03: Every state transition logged
CREATE TABLE case_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sickness_case_id UUID NOT NULL REFERENCES sickness_cases(id) ON DELETE CASCADE,
  from_status VARCHAR(30),
  to_status VARCHAR(30) NOT NULL,
  action VARCHAR(50) NOT NULL,
  performed_by UUID NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_case_transitions_case ON case_transitions(sickness_case_id);
```

### Database Schema: Guidance Engagement Table

```sql
-- GUID-04: Track which guidance manager has engaged with
CREATE TABLE guidance_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  sickness_case_id UUID NOT NULL REFERENCES sickness_cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  guidance_type VARCHAR(50) NOT NULL,      -- 'initial_contact', 'check_in', 'rtw_meeting'
  guidance_step VARCHAR(100) NOT NULL,     -- Step identifier within the guidance
  engaged_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_guidance_case ON guidance_engagement(sickness_case_id);
```

### Absence Type Categories (SICK-03)

```typescript
// constants/absence-types.ts
export enum AbsenceType {
  MUSCULOSKELETAL = "musculoskeletal",
  MENTAL_HEALTH = "mental_health",
  RESPIRATORY = "respiratory",
  SURGICAL = "surgical",
  OTHER = "other",
}

export const ABSENCE_TYPE_LABELS: Record<AbsenceType, string> = {
  [AbsenceType.MUSCULOSKELETAL]: "Musculoskeletal (e.g. back pain, injury)",
  [AbsenceType.MENTAL_HEALTH]: "Mental health (e.g. stress, anxiety)",
  [AbsenceType.RESPIRATORY]: "Respiratory (e.g. cold, flu, COVID)",
  [AbsenceType.SURGICAL]: "Surgical / planned procedure",
  [AbsenceType.OTHER]: "Other",
};
```

### Fit Note Status Enum (FIT-02)

```typescript
// From UK NHS fit note specification
export enum FitNoteStatus {
  NOT_FIT = "NOT_FIT",       // "not fit for work"
  MAY_BE_FIT = "MAY_BE_FIT", // "may be fit for work" with adjustments
}

export enum FunctionalEffect {
  PHASED_RETURN = "phased_return",
  ALTERED_HOURS = "altered_hours",
  AMENDED_DUTIES = "amended_duties",
  ADAPTED_WORKPLACE = "adapted_workplace",
}
```

### Manager Guidance Content Structure (GUID-01, GUID-03)

```typescript
// constants/guidance-content.ts
export interface GuidanceStep {
  id: string;
  title: string;
  prompt: string;       // What to say / ask
  rationale: string;    // Why this matters (not shown to employee)
  doList: string[];     // Dos
  dontList: string[];   // Don'ts
}

export interface GuidanceScript {
  type: "initial_contact" | "check_in" | "rtw_meeting";
  absenceType: AbsenceType | "general";
  steps: GuidanceStep[];
}

// Example: Initial contact guidance for mental health absence
export const GUIDANCE_SCRIPTS: GuidanceScript[] = [
  {
    type: "initial_contact",
    absenceType: "mental_health",
    steps: [
      {
        id: "ic-mh-01",
        title: "Open the conversation",
        prompt: "I hope you're doing okay. I wanted to check in and see how you're feeling. There's no pressure to share details -- I just want you to know we're here to support you.",
        rationale: "Establishes psychological safety. UK best practice: managers should express concern without probing for medical details.",
        doList: [
          "Express genuine concern",
          "Make clear there is no obligation to share details",
          "Keep tone warm and non-judgemental",
        ],
        dontList: [
          "Ask for specific diagnosis",
          "Share their absence details with the team",
          "Suggest they should be back by a certain date",
        ],
      },
      // ... more steps
    ],
  },
];
```

### New Permissions for Phase 2

```typescript
// Additions to constants/permissions.ts
export const PERMISSIONS = {
  // ... existing
  REPORT_SICKNESS: "report:sickness",
  VIEW_SICKNESS_CASES: "view:sickness_cases",
  MANAGE_SICKNESS_CASES: "manage:sickness_cases",
  VIEW_FIT_NOTES: "view:fit_notes",
  UPLOAD_FIT_NOTES: "upload:fit_notes",
  SCHEDULE_RTW: "schedule:rtw",
  COMPLETE_RTW: "complete:rtw",
  VIEW_GUIDANCE: "view:guidance",
  VIEW_ABSENCE_CALENDAR: "view:absence_calendar",
} as const;

// Permission mapping additions:
// EMPLOYEE: REPORT_SICKNESS, VIEW_SICKNESS_CASES (own only), VIEW_FIT_NOTES (own only)
// MANAGER: VIEW_SICKNESS_CASES (team), SCHEDULE_RTW, COMPLETE_RTW, VIEW_GUIDANCE, VIEW_ABSENCE_CALENDAR
// HR: all sickness permissions + UPLOAD_FIT_NOTES + VIEW_FIT_NOTES (all in org)
// ORG_ADMIN: all permissions
```

### New Enum Values for Audit Logging

```typescript
// Additions to types/enums.ts
export enum AuditEntity {
  // ... existing
  SICKNESS_CASE = "SICKNESS_CASE",
  FIT_NOTE = "FIT_NOTE",
  RTW_MEETING = "RTW_MEETING",
  GUIDANCE = "GUIDANCE",
  NOTIFICATION = "NOTIFICATION",
}

export enum AuditAction {
  // ... existing
  TRANSITION = "TRANSITION",    // State machine transition
  UPLOAD = "UPLOAD",            // File upload
  DOWNLOAD = "DOWNLOAD",       // Signed URL generated
  SCHEDULE = "SCHEDULE",       // Meeting scheduled
  SEND = "SEND",               // Notification sent
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Auth0 SDK v3 | Auth0 removed; Supabase Auth via middleware | Phase 1 (codebase) | Auth pattern already uses Supabase Auth, not Auth0 despite CLAUDE.md reference |
| Supabase client SDK for queries | Direct pg pool queries | Phase 1 (codebase) | Repository pattern already established; continue with raw SQL |
| xstate for workflows | Hand-rolled transition maps | Current recommendation | Simpler, no dependency, fits service pattern |
| Moment.js for dates | date-fns | Industry standard since 2020 | Tree-shakeable, immutable, smaller bundle |

**Deprecated/outdated:**
- Moment.js: Officially in maintenance mode. Use date-fns.
- CLAUDE.md references Auth0 SDK v4 but the actual codebase uses Supabase Auth. Research and planning should follow actual codebase patterns.

## Open Questions

1. **Supabase Storage bucket creation**
   - What we know: The Supabase project exists and is used for auth. Storage requires a bucket to be created (either via dashboard or migration).
   - What's unclear: Whether a `fit-notes` bucket already exists in the Supabase project, and what RLS policies are on storage objects.
   - Recommendation: Create bucket via Supabase dashboard during setup. Document required bucket configuration in plan. Set bucket to private (default).

2. **Guidance content authoring**
   - What we know: GUID-01 through GUID-04 require scripted guidance for managers. Content must be empathetic, action-oriented, and UK-compliant.
   - What's unclear: Who authors the guidance content? Is it a static JSON/TS file or a CMS-editable resource?
   - Recommendation: For MVP, store guidance as static TypeScript constants in `constants/guidance-content.ts`. This can be extracted to a database table later for CMS editing. Content should be authored collaboratively with domain expertise (HR/employment law).

3. **Email delivery verification**
   - What we know: SendGrid is specified in CLAUDE.md. It needs an API key and verified sender domain.
   - What's unclear: Whether SendGrid account exists and is configured for the project domain.
   - Recommendation: Plan should include SendGrid setup as a prerequisite. For development, use a sandbox/test mode.

4. **Fit note expiry alert timing (FIT-03)**
   - What we know: System should send alerts before fit note expiry.
   - What's unclear: Whether alerts are triggered by a cron job, on-demand check, or database-level scheduled function.
   - Recommendation: Use a Next.js API route as a cron endpoint (Vercel Cron Jobs or external cron service). Check daily for fit notes expiring within configurable threshold (default: 3 days). This avoids needing a separate worker process.

5. **Absence calendar view scope (SICK-06)**
   - What we know: Manager sees team absences at a glance.
   - What's unclear: Calendar component library choice -- build custom or use existing.
   - Recommendation: Build a simple month-view grid with CSS grid/Tailwind. The calendar only shows absence blocks (not a full calendar app). Avoid heavy calendar libraries for this focused use case.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: All existing files read directly from `/Users/ianread/Code/salus-bridge-web/`
- `.planning/research/ARCHITECTURE.md` - Workflow engine, database schema, component boundaries
- `.planning/research/FEATURES.md` - Feature requirements and complexity assessment
- `.planning/research/PITFALLS.md` - UK GDPR, health data isolation, audit requirements
- [Supabase Storage upload API](https://supabase.com/docs/reference/javascript/storage-from-upload) - Upload method signature and return type
- [Supabase Storage createSignedUrl](https://supabase.com/docs/reference/javascript/storage-from-createsignedurl) - Signed URL generation
- [Supabase Storage Buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals) - Private vs public bucket behaviour
- [GOV.UK Bank Holidays API](https://www.api.gov.uk/gds/bank-holidays/) - Official UK government bank holiday data
- [NHS Fit Note Extract Specification](https://digital.nhs.uk/data-and-information/publications/statistical/fit-notes-issued-by-gp-practices/guide/extract-specification) - Official fit note data fields

### Secondary (MEDIUM confidence)
- [XState v5 documentation](https://stately.ai/docs/xstate) - State machine library features (assessed but not recommended)
- [date-fns](https://date-fns.org/) - Date utility library (recommended based on ecosystem standard)
- [SendGrid Node.js SDK](https://www.npmjs.com/package/@sendgrid/mail) - Email delivery SDK
- [React Email](https://react.email/) - Email template framework

### Tertiary (LOW confidence)
- Guidance content structure: Based on training data about UK employment best practices. Actual content should be reviewed by HR/legal domain expert.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified against existing codebase + official docs
- Architecture: HIGH - Patterns follow established codebase conventions from Phase 1
- Database schema: HIGH - Follows existing migration patterns; field requirements from NHS spec + requirements doc
- State machine: HIGH - Simple transition map pattern verified against architecture research
- Notifications: MEDIUM - SendGrid not yet installed; React Email templates are new territory for this codebase
- Guidance content: LOW - Content structure is sound but actual guidance text needs domain expert review
- Pitfalls: HIGH - UK GDPR health data requirements well-documented in existing research

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (30 days -- stable domain, no fast-moving dependencies)
