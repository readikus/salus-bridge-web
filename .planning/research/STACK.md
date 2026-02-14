# Technology Stack

**Project:** SalusBridge - Workplace Health Coordination Platform
**Researched:** 2026-02-14
**Mode:** Complementary libraries within a decided stack
**Overall Confidence:** MEDIUM (training data only -- no live verification available)

> **Note:** The core stack is already decided (Next.js 16, React 19, TypeScript 5.9, PostgreSQL/Supabase, Auth0, Tailwind/shadcn, Vercel). This document covers complementary libraries and patterns needed specifically for a UK GDPR-compliant health data platform.

---

## Decided Stack (Confirmed)

### Core Framework
| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| Next.js | 16 | App Router, SSR, API routes | Decided |
| React | 19 | UI framework | Decided |
| TypeScript | 5.9 | Type safety | Decided |
| Yarn | latest | Package manager | Decided |

### Database & Data Layer
| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| PostgreSQL | 15+ | Primary database (Supabase-hosted) | Decided |
| pg | 8.x | Direct connection pool | Decided |
| Knex | 3.x | Migrations only | Decided |

### Auth & State
| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| @auth0/nextjs-auth0 | 4.x | Authentication, magic links | Decided |
| Zustand | 5.x | Client state | Decided |
| @tanstack/react-query | 5.x | Server state / caching | Decided |
| nuqs | latest | URL state | Decided |

### UI & Forms
| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| Tailwind CSS | 3.x | Styling | Decided |
| shadcn/ui | latest | Component library | Decided |
| React Hook Form | 7.x | Form management | Decided |
| Zod | 3.x | Schema validation | Decided |
| @tanstack/react-table | 8.x | Data tables | Decided |
| lucide-react | latest | Icons | Decided |

### Infrastructure
| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| Vercel | - | Hosting / deployment | Decided |
| Sentry | 10.x | Error tracking | Decided |
| SendGrid | latest | Email delivery | Decided |
| React Email | latest | Email templates | Decided |
| Supabase Storage | - | File uploads | Decided |
| Vitest | 3.x | Unit tests | Decided |
| Playwright | latest | E2E tests | Decided |

---

## Complementary Libraries -- Health Data Platform

### 1. Encryption & Data Protection

Special category health data under UK GDPR requires encryption at rest and in transit beyond what Supabase provides by default.

| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|------------|
| **Node.js crypto** (built-in) | - | Field-level AES-256-GCM encryption for health data columns | No external dependency. AES-256-GCM provides authenticated encryption. Use for: fit note content, GP details, medical conditions, diagnosis text. Do NOT encrypt foreign keys or indexed lookup fields. | HIGH |

**Pattern -- Field-Level Encryption Service:**

```typescript
// utils/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

export class FieldEncryption {
  private key: Buffer;

  constructor() {
    const secret = process.env.ENCRYPTION_SECRET!;
    const salt = process.env.ENCRYPTION_SALT!;
    this.key = scryptSync(secret, salt, 32);
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  decrypt(stored: string): string {
    const [ivB64, authTagB64, encryptedB64] = stored.split(':');
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const encrypted = Buffer.from(encryptedB64, 'base64');
    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(encrypted) + decipher.final('utf8');
  }
}
```

**Why not external encryption libraries:**
- `crypto-js` is slower and less secure than Node.js built-in crypto
- `@aws-sdk/client-kms` adds AWS dependency when you are on Vercel/Supabase
- Built-in `crypto` is FIPS-compliant, zero dependencies, and well-audited

**What to encrypt:** Fit note free text, GP names/addresses, medical condition descriptions, diagnosis details, employee health notes.
**What NOT to encrypt:** IDs, foreign keys, dates (needed for queries), status enums, organisation IDs.

---

### 2. Audit Logging

UK GDPR Article 30 requires records of processing activities. Health data access must be logged immutably.

| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|------------|
| **Custom audit_logs table** | - | Immutable append-only audit trail | No library needed. A PostgreSQL table with INSERT-only permissions (no UPDATE/DELETE) via a database role is the most reliable approach. | HIGH |

**Pattern -- Audit Log Schema:**

```sql
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  actor_id UUID NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  organisation_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address INET
);

REVOKE UPDATE, DELETE ON audit_logs FROM app_role;

CREATE INDEX idx_audit_logs_resource ON audit_logs (resource_type, resource_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs (actor_id);
CREATE INDEX idx_audit_logs_org_time ON audit_logs (organisation_id, timestamp DESC);
```

---

### 3. CSV Processing (Employee Import)

| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|------------|
| **papaparse** | ^5.4 | CSV parsing with streaming, headers, type detection | Most downloaded CSV parser. Handles edge cases (quoted fields, BOM, different line endings). Stream mode for large files. | MEDIUM |

**Why NOT alternatives:**
- `csv-parse` -- more Node.js-oriented but papaparse is isomorphic
- `fast-csv` -- good but less ecosystem support
- `d3-dsv` -- too minimal, no error handling per row

---

### 4. Analytics & Charting

| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|------------|
| **recharts** | ^2.12 | React charting for analytics dashboards | Built on React and D3. Declarative API. Good TypeScript support. Responsive by default. | MEDIUM |

**Why NOT alternatives:**
- `@tremor/react` -- opinionated dashboard components, overlaps with shadcn/ui
- `@nivo/core` -- heavier bundle, more complex API
- `chart.js` / `react-chartjs-2` -- imperative API
- `visx` -- too low-level

---

### 5. Date Handling

| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|------------|
| **date-fns** | ^3.6 | Date manipulation, formatting, working day calculations | Tree-shakeable. Immutable. Pure functions. Has `differenceInBusinessDays`, `eachDayOfInterval`, `isWeekend`. | MEDIUM |

**UK-specific pattern -- Working Days Calculator:**

```typescript
import { differenceInBusinessDays, isWeekend } from 'date-fns';

export function calculateWorkingDaysLost(startDate: Date, endDate: Date, bankHolidays: Date[]): number {
  let workingDays = differenceInBusinessDays(endDate, startDate);
  for (const holiday of bankHolidays) {
    if (holiday >= startDate && holiday <= endDate && !isWeekend(holiday)) {
      workingDays--;
    }
  }
  return Math.max(0, workingDays);
}
```

---

### 6. PDF Generation

| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|------------|
| **@react-pdf/renderer** | ^3.4 | PDF generation using React components | Write PDFs as React components. Runs on server in API routes. | MEDIUM |

**Caution:** Significant bundle size. Only import in API routes / server components.

---

### 7. Document Storage

| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|------------|
| **@supabase/storage-js** | ^2.x | Supabase Storage client for signed URLs and uploads | Part of Supabase ecosystem. Short-lived signed URLs (5 min max) for health documents. | MEDIUM |
| **sharp** | ^0.33 | Image processing for uploaded documents | Resize/compress uploaded images. Strip EXIF metadata (privacy risk). | MEDIUM |

**Storage bucket structure:**
```
health-documents/
  {organisation_id}/
    fit-notes/
      {employee_id}/{uuid}.{ext}
    rtw-documents/
      {employee_id}/{uuid}.{ext}
    exports/
      {report_id}.pdf
```

---

### 8. Rate Limiting & Security

| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|------------|
| **@upstash/ratelimit** | latest | API rate limiting | Serverless-compatible. Essential for health data endpoints. | MEDIUM |
| **Security headers** (manual) | - | CSP, HSTS, X-Frame-Options | Via next.config.js, not helmet dependency. | HIGH |

---

### 9. Background Jobs / Scheduled Tasks

| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|------------|
| **Vercel Cron Jobs** | - | Scheduled tasks | Native to platform. Zero infrastructure. Sufficient for MVP. | HIGH |
| **inngest** | ^3.x | Event-driven background jobs (if needed) | Defer to Phase 2+. For complex multi-step workflows. | LOW |

```json
// vercel.json
{
  "crons": [
    { "path": "/api/cron/fit-note-expiry-check", "schedule": "0 8 * * *" },
    { "path": "/api/cron/absence-reminder", "schedule": "0 9 * * 1-5" },
    { "path": "/api/cron/data-retention-cleanup", "schedule": "0 2 * * 0" }
  ]
}
```

---

## What NOT to Install

| Library | Why Not |
|---------|---------|
| `crypto-js` | Slower, less secure than built-in Node.js crypto |
| `moment` | Deprecated, massive bundle. Use date-fns. |
| `winston` / `pino` | Audit logs are structured data, not application logs. Use PostgreSQL. |
| `helmet` | Next.js handles security headers via config. |
| `casl` / `casbin` | Overkill for 5 static roles. Custom permission map is ~30 lines. |
| `prisma` / `drizzle` | Project uses raw SQL via pg pool (decided). |
| `@tremor/react` | Overlaps with shadcn/ui. Use recharts for charts. |
| `bullmq` | Requires Redis infrastructure. Use Vercel Cron for MVP. |
| `passport` | Auth0 SDK handles authentication. |
| `bcrypt` | Auth0 handles password hashing. Magic links for employees. |
| Supabase JS client SDK | Project uses direct pg connection (decided). |

---

## Roadmap Implications

- **Phase 1 (Foundation):** Set up encryption service, audit logging table, RBAC middleware, security headers
- **Phase 2 (Core Features):** Add papaparse for CSV import, date-fns for absence calculations, Supabase Storage patterns for fit notes
- **Phase 3 (Analytics/Reports):** Add recharts for dashboards, @react-pdf/renderer for exports
- **Phase 4 (Compliance):** Add archiver for SAR exports, data retention cron jobs

## Open Questions

- Verify all MEDIUM-confidence library versions against npm before installing
- Confirm sharp compatibility with Next.js 16 on Vercel (serverless function size limits)
- Confirm @react-pdf/renderer works within Vercel serverless memory constraints
- Evaluate Vercel KV pricing for rate limiting at expected scale

---
*Researched: 2026-02-14*
*Confidence: MEDIUM -- training data only, no live verification*
