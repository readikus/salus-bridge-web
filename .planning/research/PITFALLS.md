# Domain Pitfalls

**Domain:** Workplace health coordination SaaS (UK market)
**Researched:** 2026-02-14
**Overall confidence:** MEDIUM (based on training data -- web search unavailable; UK GDPR specifics should be verified against ICO guidance)

---

## Critical Pitfalls

Mistakes that cause regulatory action, data breaches, loss of trust, or rewrites.

### Pitfall 1: Treating Health Data Like Normal Personal Data

**What goes wrong:** Developers apply standard GDPR personal-data protections (lawful basis: legitimate interest, basic access controls) to health information. Under UK GDPR, health data is "special category data" (Article 9) requiring an explicit, elevated lawful basis -- typically explicit consent or substantial public interest (Schedule 1 DPA 2018). Treating it as normal data means your entire legal basis is wrong.

**Why it happens:** Teams familiar with GDPR for SaaS (email, name, billing) assume the same patterns apply. Health conditions, fit notes, GP details, and absence reasons all qualify as special category data, but this is easy to overlook when the UI feels like "just an HR tool."

**Consequences:**
- ICO enforcement action (fines up to 17.5M GBP or 4% of turnover)
- Contracts with organisations become unenforceable
- Rewrite of consent flows, data storage, and access controls
- Reputational damage that kills B2B trust

**Prevention:**
- Establish the lawful basis for processing special category data before writing any code. Document it in a Data Protection Impact Assessment (DPIA) -- this is mandatory under UK GDPR when processing health data at scale.
- Implement explicit consent capture at data entry points (sickness reporting, fit note upload) with granular, withdrawable consent records.
- Every database table containing health data must be tagged/classified as special category. Build this classification into the schema from day one.
- Appoint or consult a DPO (Data Protection Officer) before launch -- likely mandatory given the scale and sensitivity.

**Detection (warning signs):**
- No DPIA exists
- Consent records are not stored alongside health data
- No distinction in the data model between "personal data" and "special category data"
- Privacy policy does not specifically mention Article 9 / Schedule 1

**Phase:** Must be addressed in Phase 1 (foundation). Cannot be retrofitted without significant rework.

**Confidence:** HIGH -- UK GDPR Article 9 requirements are well-established law.

---

### Pitfall 2: Cross-Tenant Data Leakage in Health Context

**What goes wrong:** A query, API response, or UI component exposes Organisation A's employee health data to Organisation B. In a health data context, this is catastrophic -- a reportable breach to the ICO within 72 hours, mandatory notification to affected individuals, and potential regulatory action.

**Why it happens:**
- Missing tenant scoping on database queries (forgot a WHERE organisation_id = $1)
- Shared caches (Redis, React Query) not keyed by tenant
- API routes that accept organisation_id from the client without server-side verification
- Admin/support tools that bypass tenant isolation

**Prevention:**
- **Row-Level Security (RLS):** PostgreSQL RLS policies on every table containing tenant-scoped data.
- **Repository pattern enforcement:** Every repository method MUST include organisation_id in the WHERE clause.
- **API route middleware:** Verify the authenticated user's organisation matches the requested resource's organisation.
- **Cache isolation:** React Query keys must include organisation_id.
- **Automated testing:** Integration tests that specifically attempt cross-tenant access and assert failure.

**Phase:** Phase 1 (database design, repository pattern).

**Confidence:** HIGH -- well-documented multi-tenant SaaS risk, amplified by health data sensitivity.

---

### Pitfall 3: Over-Exposing Health Details to Managers

**What goes wrong:** The platform shows managers specific medical conditions when they only need absence dates and guidance. Violates data minimisation (Article 5(1)(c)) and potentially Equality Act 2010.

**Prevention:**
- **Field-level access control** with visibility tiers: Employee (full), HR (full + patterns), Manager (dates + actions only), Platform admin (aggregates only)
- **Separate API response shapes** per role -- don't filter in frontend
- **Audit every field exposure**

**Phase:** Phase 1 (data model) and Phase 2 (API/UI).

**Confidence:** HIGH.

---

### Pitfall 4: Inadequate Audit Trail for Health Data Access

**What goes wrong:** Cannot answer "who accessed Employee X's health data and when?" Critical for SARs, ICO investigations, and internal disputes.

**Prevention:**
- Build audit logging into the service layer from day one
- Immutable append-only audit log table
- Separate from application logs
- Middleware/decorator approach for automatic logging

**Phase:** Phase 1 (foundation). Must be in place before any health data flows through the system.

**Confidence:** HIGH.

---

### Pitfall 5: Consent Model That Does Not Support Withdrawal

**What goes wrong:** Consent captured as boolean flag with no withdrawal mechanism. UK GDPR requires consent be as easy to withdraw as to give (Article 7(3)).

**Prevention:**
- Granular consent records per purpose with timestamps
- Consent cascade logic (what happens on withdrawal)
- Separation of lawful bases (not everything needs consent)
- UI for consent management

**Phase:** Phase 1 (consent model design), Phase 2 (UI).

**Confidence:** HIGH.

---

### Pitfall 6: Fit Note Data Entry That Creates Legal Liability

**What goes wrong:** Free-text transcription of fit notes creates informal medical records that may be inaccurate and used in employment disputes.

**Prevention:**
- Structured data capture only (dropdowns matching official fit note fields)
- Document upload as primary record, not transcription
- No diagnosis codes -- use broad absence reason categories
- Disclaimers: management tool, not medical record

**Phase:** Phase 2 (sickness reporting). Design capture approach before building UI.

**Confidence:** MEDIUM.

---

## Moderate Pitfalls

### Pitfall 7: Magic Link Authentication Without Health-Data-Grade Security

**Prevention:**
- Single-use with short expiry (10-15 minutes max)
- Secondary verification (DOB, employee number) before health data access
- Never reveal health context in email subject/body
- Allow PIN/passkey after first login

**Phase:** Phase 1 (authentication setup).

---

### Pitfall 8: CSV Import That Imports Problems

**Prevention:**
- Strict schema validation -- reject unexpected columns (especially health-related)
- Dry-run preview mode before committing
- Duplicate detection on email + organisation
- UTF-8 encoding handling, size limits (500 rows)

**Phase:** Phase 2-3.

---

### Pitfall 9: Workflow Engine Becomes Unmaintainable State Machine

**Prevention:**
- Explicit finite state machine with defined states, transitions, guards
- Workflow definition as data, separate from execution
- Transition logging (timestamp, actor, from-state, to-state, reason)
- Idempotent actions, reliable time-based transitions

**Phase:** Phase 2. Design the pattern before building first workflow.

---

### Pitfall 10: Data Retention Without Deletion Capability

**Prevention:**
- Define retention periods per data type
- Soft delete first, hard delete on schedule
- Cascade deletion logic with anonymised audit trails
- Automated retention enforcement via cron
- Employee offboarding triggers retention countdown

**Phase:** Design into schema from Phase 1, implement Phase 2-3.

---

### Pitfall 11: Notification System That Reveals Health Information

**Prevention:**
- Minimal notification content ("An action requires your attention")
- Deep link to authenticated context
- No employee names, conditions, or health details in emails
- Test with lock screen preview assumption

**Phase:** Phase 2 (notification system).

---

### Pitfall 12: Analytics That Enable Re-identification

**Prevention:**
- Minimum cohort size (5-10 people) -- show "Insufficient data" for smaller groups
- Suppress small counts (1-2)
- No drill-down to individuals from aggregates
- Broad categories only for small teams

**Phase:** Phase 3 (analytics dashboard).

---

## Minor Pitfalls

### Pitfall 13: Ignoring the Employee Experience

- Sickness reporting must be achievable in under 2 minutes on mobile
- Clear data visibility explanations ("Your manager will see X. HR will see Y.")
- Avoid surveillance language

### Pitfall 14: Hardcoded UK Employment Law Assumptions

- Make SSP rates, trigger points, fit note thresholds configurable per organisation
- Track legislative changes as ongoing maintenance

### Pitfall 15: Supabase Storage Without Health-Data-Appropriate Access Controls

- Private buckets only
- Short-lived signed URLs (5-10 minutes max)
- Server-side access control via API routes
- File metadata in PostgreSQL with tenant isolation

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Foundation / Data Model | Health data not classified as special category | DPIA before code. Tag tables. Implement RLS. |
| Foundation / Auth | Magic links insufficient for health data | Secondary verification. Short expiry. No health context in emails. |
| Foundation / Multi-tenancy | Tenant isolation at application layer only | PostgreSQL RLS as defence in depth. Test cross-tenant access. |
| Sickness Reporting | Over-collection of health details | Structured capture. Document upload over transcription. |
| Sickness Reporting | Dual-path workflow complexity | Explicit state machine. Log all transitions. |
| Manager Features | Exposing health details to managers | Field-level access control. Role-specific API responses. |
| Notifications | Health information in content | Minimal content policy. No names/conditions. |
| Analytics | Re-identification through small cohorts | Minimum cohort size. Suppress small counts. |
| CSV Import | Importing health data via CSV | Strict column whitelist. |
| Data Retention | No deletion capability | Retention periods in schema. Automated expiry. |

## Sources

- UK GDPR (retained EU GDPR via Data Protection Act 2018)
- ICO guidance on special category data processing
- ICO guidance on Data Protection Impact Assessments
- Multi-tenant SaaS security patterns (OWASP)
- UK fit note (Statement of Fitness for Work) regulations
- Statistical disclosure control principles (ONS guidelines)

---
*Researched: 2026-02-14*
*Confidence: MEDIUM -- training data only*
