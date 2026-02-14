# Architecture Patterns

**Domain:** Multi-tenant workplace health coordination SaaS (B2B)
**Researched:** 2026-02-14
**Confidence:** MEDIUM (training data only -- WebSearch unavailable)

## Recommended Architecture

SalusBridge follows a **layered monolith** within Next.js App Router, with strict tenant isolation enforced at the repository layer. The system is not a microservices architecture -- it is a well-structured monolith deployed on Vercel with PostgreSQL on Supabase.

```
Browser
  |
  v
Next.js Middleware (Auth0 session + route protection)
  |
  v
App Router
  ├── Server Components (read-heavy pages, RSC data loading)
  ├── API Routes /app/api/* (mutations, complex reads)
  |     |
  |     v
  |   Services (business logic, workflow orchestration)
  |     |
  |     v
  |   Repositories (raw SQL, tenant-scoped queries)
  |     |
  |     v
  |   PostgreSQL (Supabase) + Supabase Storage
  |
  ├── Client Components (forms, interactive UI)
  |     |
  |     v
  |   Actions (fetch* wrappers calling API routes)
  |     |
  |     v
  |   React Query (caching) + Zustand (local state)
  |
  v
External Services: Auth0, SendGrid, Pipedrive, Credit Safe
```

### Multi-Tenancy Strategy: Row-Level with org_id

**Decision: Row-level tenancy (org_id column on every tenant-scoped table).**

Why not schema-per-tenant:
- Schema-per-tenant adds operational complexity (migration rollout across N schemas, connection pooling per schema, Supabase does not natively support dynamic schema routing)
- SalusBridge targets SME customers (tens to low hundreds of orgs, not thousands) -- row-level is standard and proven at this scale
- Cross-tenant reporting for platform admins is trivial with row-level, painful with schema-per-tenant
- PostgreSQL Row-Level Security (RLS) policies provide database-level enforcement as a safety net

**Implementation pattern:**

Every repository method that touches tenant data receives `orgId` as a required parameter. This is not optional -- it is the primary isolation mechanism.

```typescript
// providers/repositories/EmployeeRepository.ts
class EmployeeRepository {
  static async findByOrg(orgId: string): Promise<Employee[]> {
    const result = await pool.query(
      `SELECT id, org_id AS "orgId", first_name AS "firstName",
              last_name AS "lastName", email
       FROM employees
       WHERE org_id = $1 AND deleted_at IS NULL
       ORDER BY last_name`,
      [orgId]
    );
    return result.rows;
  }
}
```

**PostgreSQL RLS as safety net (not primary mechanism):**

RLS policies act as a defence-in-depth layer. The application sets a session variable with the current org_id, and RLS policies enforce it at the database level even if application code has a bug.

```sql
-- Applied via migration
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON employees
  USING (org_id = current_setting('app.current_org_id')::uuid);
```

The pg pool wrapper sets this on each connection checkout:

```typescript
// utils/db.ts
async function getConnection(orgId: string) {
  const client = await pool.connect();
  await client.query(`SET app.current_org_id = '${orgId}'`);
  return client;
}
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Middleware** | Auth0 session validation, route protection, org context extraction | Auth0, App Router |
| **Server Components** | Read-heavy page rendering, initial data loading | Services (directly), Repositories (via services) |
| **API Routes** | Mutations, complex operations, webhook endpoints | Services |
| **Services** | Business logic, workflow state transitions, permission checks, cross-entity orchestration | Repositories, External APIs |
| **Repositories** | Data access, SQL queries, tenant-scoped reads/writes | PostgreSQL |
| **Audit Logger** | Immutable audit trail for all health data access | PostgreSQL (audit tables) |
| **Workflow Engine** | State machine for sickness/RTW flows | Services, Repositories |
| **Notification Service** | Email dispatch for workflow events | SendGrid, React Email templates |
| **Storage Service** | Document upload/download with signed URLs | Supabase Storage |
| **Zustand Stores** | Client-side UI state (current org, active workflow, UI toggles) | React Components |
| **React Query** | Server state cache, optimistic updates | API Routes via Actions |

### Data Flow

**Read flow (Server Component page load):**
```
URL with org slug → Middleware validates session →
  Server Component calls Service → Service calls Repository with orgId →
  Repository executes SQL with org_id WHERE clause →
  Data returned, rendered as RSC HTML
```

**Write flow (form submission):**
```
Client Component form → Action (fetch*) → API Route →
  API Route extracts session + orgId → Service validates + applies business logic →
  Service calls Repository → Repository executes parameterised INSERT/UPDATE →
  Audit Logger records the operation → Response returned →
  React Query invalidates cache → UI updates
```

**Workflow transition flow:**
```
Manager clicks "Approve RTW" → Action → API Route →
  WorkflowService.transition(caseId, 'approve_rtw', userId) →
  Validates current state allows transition →
  Updates case status → Creates audit entry →
  Triggers notification (email to employee) →
  Returns new state → UI reflects new status
```

## Core Architectural Components

### 1. Tenant Context Provider

A server-side utility that resolves the current organisation from the Auth0 session and makes it available throughout the request lifecycle.

```typescript
// utils/tenant-context.ts
import { getSession } from '@auth0/nextjs-auth0';

export async function getTenantContext() {
  const session = await getSession();
  if (!session?.user) throw new AuthError('Not authenticated');

  const user = await UserService.getByAuth0Id(session.user.sub);
  if (!user.orgId) throw new AuthError('No organisation assigned');

  return {
    userId: user.id,
    orgId: user.orgId,
    role: user.role,
    email: session.user.email,
  };
}
```

Every API route and Server Component that accesses tenant data calls `getTenantContext()` first. This is the single source of truth for "who is requesting and which org do they belong to."

### 2. Role-Based Access Control (RBAC)

**Auth0 handles authentication. The application handles authorisation.**

Auth0 provides identity (who you are). The application database stores roles and permissions (what you can do). Do not use Auth0 roles/permissions for application-level RBAC -- it creates coupling and makes role changes require Auth0 API calls.

```
Roles hierarchy:
  PLATFORM_ADMIN  -- SalusBridge staff, cross-tenant access
  ORG_ADMIN       -- Organisation administrator (HR director)
  HR_USER         -- HR team member within an org
  MANAGER         -- Line manager, sees their direct reports only
  EMPLOYEE        -- Self-service only
```

**Permission model:**

```typescript
// types/permissions.ts
type Permission =
  | 'cases:read'        // View sickness cases
  | 'cases:write'       // Create/update cases
  | 'cases:read_all'    // View all cases in org (not just own reports)
  | 'employees:read'    // View employee directory
  | 'employees:write'   // Create/edit employees
  | 'reports:view'      // View analytics/reports
  | 'settings:manage'   // Org settings
  | 'audit:view'        // View audit logs
  | 'health_data:read'  // Access sensitive health records
  | 'health_data:write' // Modify health records

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  PLATFORM_ADMIN: ['*'], // all permissions, cross-tenant
  ORG_ADMIN: ['cases:read', 'cases:write', 'cases:read_all', 'employees:read',
               'employees:write', 'reports:view', 'settings:manage', 'audit:view',
               'health_data:read', 'health_data:write'],
  HR_USER: ['cases:read', 'cases:write', 'cases:read_all', 'employees:read',
             'health_data:read', 'health_data:write'],
  MANAGER: ['cases:read', 'cases:write', 'employees:read'],
  EMPLOYEE: ['cases:read'], // own cases only
};
```

**Key design decision:** Managers do NOT see health data by default. They see case status (absent/returned) and guidance ("ask these questions in RTW meeting") but not diagnosis details, fit notes, or medical documents. This is a UK GDPR requirement for special category data -- access must be on a need-to-know basis.

### 3. Health Data Isolation Layer

Health data (diagnoses, fit notes, medical documents, OH referral details) requires stricter controls than general employee data.

**Separate health_records table with additional access controls:**

```sql
-- General employee data (name, dept, manager, start date)
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  department VARCHAR(100),
  manager_id UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Health data in separate table, accessed only by authorised roles
CREATE TABLE health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  case_id UUID NOT NULL REFERENCES sickness_cases(id),
  record_type VARCHAR(50) NOT NULL, -- 'diagnosis', 'fit_note', 'oh_referral', 'rtw_notes'
  content_encrypted TEXT, -- encrypted at application level for sensitive fields
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Access pattern:** The HealthRecordRepository checks both `org_id` AND whether the requesting user's role has `health_data:read` permission. Every access is audit-logged.

### 4. Audit Trail System

**Non-negotiable for UK GDPR compliance with special category data.** Every read, write, and delete of health data must be logged.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,     -- 'read', 'create', 'update', 'delete', 'export'
  entity_type VARCHAR(50) NOT NULL, -- 'health_record', 'sickness_case', 'employee', 'fit_note'
  entity_id UUID NOT NULL,
  metadata JSONB,                   -- additional context (IP, fields changed, reason)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- This table is INSERT-ONLY. No updates, no deletes.
-- Index for common queries
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at);
CREATE INDEX idx_audit_org ON audit_logs(org_id, created_at);
```

**Implementation as a service wrapper:**

```typescript
// providers/services/AuditService.ts
class AuditService {
  static async log(params: {
    orgId: string;
    userId: string;
    action: 'read' | 'create' | 'update' | 'delete' | 'export';
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  }) {
    await AuditRepository.create(params);
  }
}
```

Services call `AuditService.log()` after every health data operation. This is enforced by convention and code review -- the audit call lives in the service layer, not the repository layer, because it needs user context.

### 5. Workflow Engine (State Machine)

Sickness cases follow a defined lifecycle. Model this as a finite state machine, not ad-hoc status updates.

```
States:
  REPORTED → TRACKING → FIT_NOTE_RECEIVED → RTW_SCHEDULED →
  RTW_COMPLETED → CLOSED

  REPORTED → TRACKING → LONG_TERM → OH_REFERRAL →
  RTW_SCHEDULED → RTW_COMPLETED → CLOSED

Transitions (action → from_state → to_state):
  report_sickness:    null → REPORTED
  acknowledge:        REPORTED → TRACKING
  receive_fit_note:   TRACKING → FIT_NOTE_RECEIVED
  escalate_long_term: TRACKING → LONG_TERM (trigger: >28 days or policy threshold)
  refer_to_oh:        LONG_TERM → OH_REFERRAL
  schedule_rtw:       FIT_NOTE_RECEIVED | OH_REFERRAL → RTW_SCHEDULED
  complete_rtw:       RTW_SCHEDULED → RTW_COMPLETED
  close_case:         RTW_COMPLETED → CLOSED
  reopen:             CLOSED → TRACKING
```

**Database model:**

```sql
CREATE TABLE sickness_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organisations(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  status VARCHAR(30) NOT NULL DEFAULT 'REPORTED',
  absence_start_date DATE NOT NULL,
  absence_end_date DATE,
  reported_by UUID NOT NULL REFERENCES users(id),
  assigned_to UUID REFERENCES users(id), -- HR user managing the case
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE case_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES sickness_cases(id),
  from_status VARCHAR(30),
  to_status VARCHAR(30) NOT NULL,
  action VARCHAR(50) NOT NULL,
  performed_by UUID NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**WorkflowService enforces valid transitions:**

```typescript
// providers/services/WorkflowService.ts
const VALID_TRANSITIONS: Record<string, Record<string, string>> = {
  REPORTED: { acknowledge: 'TRACKING' },
  TRACKING: {
    receive_fit_note: 'FIT_NOTE_RECEIVED',
    escalate_long_term: 'LONG_TERM',
  },
  LONG_TERM: { refer_to_oh: 'OH_REFERRAL' },
  FIT_NOTE_RECEIVED: { schedule_rtw: 'RTW_SCHEDULED' },
  OH_REFERRAL: { schedule_rtw: 'RTW_SCHEDULED' },
  RTW_SCHEDULED: { complete_rtw: 'RTW_COMPLETED' },
  RTW_COMPLETED: { close_case: 'CLOSED' },
  CLOSED: { reopen: 'TRACKING' },
};

class WorkflowService {
  static async transition(caseId: string, action: string, userId: string, orgId: string) {
    const currentCase = await SicknessCaseRepository.findById(caseId, orgId);
    const validActions = VALID_TRANSITIONS[currentCase.status];

    if (!validActions?.[action]) {
      throw new WorkflowError(`Cannot ${action} from ${currentCase.status}`);
    }

    const newStatus = validActions[action];

    await SicknessCaseRepository.updateStatus(caseId, newStatus, orgId);
    await CaseTransitionRepository.create({
      caseId, fromStatus: currentCase.status, toStatus: newStatus,
      action, performedBy: userId,
    });
    await AuditService.log({
      orgId, userId, action: 'update',
      entityType: 'sickness_case', entityId: caseId,
      metadata: { fromStatus: currentCase.status, toStatus: newStatus, action },
    });

    // Trigger side effects (notifications, escalations)
    await WorkflowService.handleSideEffects(currentCase, newStatus, action, orgId);

    return { ...currentCase, status: newStatus };
  }
}
```

### 6. Document Storage

Fit notes, medical documents, and OH reports stored in Supabase Storage with access-controlled signed URLs.

**Pattern:**
- Documents stored in Supabase Storage bucket, organised by `org_id/case_id/filename`
- Metadata (who uploaded, when, document type) stored in PostgreSQL
- Access via short-lived signed URLs generated server-side after permission check
- Documents are never served directly to the client -- always through an API route that validates permissions first

```typescript
// API route: app/api/documents/[id]/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const ctx = await getTenantContext();
  const doc = await DocumentRepository.findById(params.id, ctx.orgId);

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Permission check
  await AuthorisationService.requirePermission(ctx, 'health_data:read');

  // Audit log every document access
  await AuditService.log({
    orgId: ctx.orgId, userId: ctx.userId, action: 'read',
    entityType: 'document', entityId: doc.id,
  });

  // Generate short-lived signed URL (5 minutes)
  const signedUrl = await StorageService.getSignedUrl(doc.storagePath, 300);

  return NextResponse.json({ url: signedUrl });
}
```

## Patterns to Follow

### Pattern 1: Tenant-Scoped Repository Methods

**What:** Every repository method that touches tenant data takes `orgId` as a required parameter and includes it in the WHERE clause.

**When:** Always, for every query on tenant-scoped tables.

**Why:** Makes tenant isolation explicit and impossible to forget. The org_id parameter is not optional -- it is the first line of defence.

### Pattern 2: Service-Level Permission Checks

**What:** Services validate permissions before executing business logic. Repositories do not check permissions -- they are dumb data access.

**When:** Every service method that reads or writes data.

### Pattern 3: Immutable Event Log for Workflows

**What:** Every state change creates a new `case_transitions` row. Never update history. The current status lives on `sickness_cases.status`, but the full history is in `case_transitions`.

**Why:** Audit requirement, debugging, analytics ("average time in TRACKING before RTW").

### Pattern 4: Server Components for Data Display, API Routes for Mutations

**What:** Use Server Components (RSC) to fetch and render read-only data. Use API Routes for all mutations (create, update, delete, state transitions).

**When:** Always. Do not use Server Actions for mutations in this application -- API Routes provide a clearer audit boundary and are easier to protect with middleware.

## Anti-Patterns to Avoid

| Anti-Pattern | Why Bad | Instead |
|-------------|---------|---------|
| Optional org_id in queries | Single query without org_id exposes all tenants | org_id always required in repository signatures |
| Client-side permission checks only | Anyone with dev tools bypasses it | UI hides for UX, services enforce for security |
| Health data in general tables | Cannot apply differentiated GDPR access rules | Separate health_records table |
| Ad-hoc status updates | Skips validation and audit trail | All changes via WorkflowService.transition() |
| Storing files in database | Bloats DB, slows backups, no CDN benefit | Supabase Storage for files, PostgreSQL for metadata |

## Database Schema Overview

```
organisations
  ├── users (login accounts, linked to Auth0)
  ├── employees (workforce records, may or may not have user accounts)
  ├── sickness_cases
  │     ├── case_transitions (state change history)
  │     ├── health_records (sensitive medical data)
  │     └── documents (file metadata, actual files in Supabase Storage)
  ├── rtw_meetings (return-to-work meeting records)
  ├── notification_log (emails sent)
  └── audit_logs (all data access records)

Platform-level tables (no org_id):
  ├── organisations (the tenants themselves)
  ├── platform_settings
  └── platform_audit_logs
```

**Key relationships:**
- An `employee` may or may not have a `user` account (employees added via CSV import get records before they ever log in)
- A `user` belongs to one `organisation` (no cross-org access except platform admins)
- A `sickness_case` belongs to one `employee` and one `organisation`
- `health_records` are linked to a `sickness_case` and are separately permission-controlled
- `audit_logs` are append-only, never updated or deleted

## Suggested Build Order

Based on component dependencies:

1. **Database foundation** -- organisations, users, employees tables, pg pool setup, RLS policies, Knex migration infrastructure
2. **Auth + tenant context** -- Auth0 integration, middleware, getTenantContext(), role definitions
3. **Core repositories + services** -- OrganisationRepository, UserRepository, EmployeeRepository with org_id scoping
4. **Audit trail** -- AuditService + audit_logs table (build early so all subsequent features use it)
5. **Employee management** -- CRUD, CSV import, manager hierarchy
6. **Sickness case workflow** -- Case model, WorkflowService state machine, case_transitions
7. **Health records + documents** -- Separate health data tables, Supabase Storage integration, signed URLs
8. **Notifications** -- SendGrid + React Email for workflow events
9. **Analytics/reporting** -- Aggregated dashboards per org
10. **Platform admin** -- Cross-tenant views, org management

**Ordering rationale:**
- Items 1-4 are foundational -- everything depends on them
- Item 5 (employees) before item 6 (cases) because cases reference employees
- Item 7 (health records) after cases because health records attach to cases
- Audit trail (item 4) built early so items 5-10 all have audit logging from day one
- Notifications (item 8) deferred because workflows function without email initially

---
*Researched: 2026-02-14*
*Confidence: MEDIUM -- training data only, WebSearch unavailable*
