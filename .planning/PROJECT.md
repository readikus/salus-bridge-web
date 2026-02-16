# SalusBridge

## What This Is

SalusBridge is a B2B SaaS workplace health coordination platform that connects organisations, employees, managers, HR teams, and healthcare providers. It streamlines sickness reporting, return-to-work workflows, and early intervention support — with the goal of reducing friction, encouraging early action, and normalising workplace health conversations.

UK-first but designed for international expansion. Handles sensitive health data (fit notes, GP details, specific conditions) requiring special category data handling under UK GDPR.

## Core Value

An employee can report sickness and be guided through a complete return-to-work cycle — with their manager receiving structured, empathetic guidance at every step.

## Current Milestone: v1.1 Landing & Waitlist

**Goal:** A polished landing page at `/` that serves as the front door for app.salusbridge.com — with full marketing content, login for invited users, and a waitlist for prospects.

**Target features:**
- Full landing page (hero, features, how it works, social proof, CTA)
- Login form for invited users (Supabase email/password)
- Waitlist form with database storage (name + email)
- Evolved purple brand identity (same family, more modern)

## Requirements

### Validated

- ✓ Platform admin can create and manage organisations — v1.0 Phase 1
- ✓ Organisation admin can import employees via CSV with validation — v1.0 Phase 1
- ✓ Role-based access (platform admin, org admin, manager, HR, employee) — v1.0 Phase 1
- ✓ Employee or manager can initiate a sickness report — v1.0 Phase 2
- ✓ Fit note tracking and documentation — v1.0 Phase 2
- ✓ Guided return-to-work workflow — v1.0 Phase 2
- ✓ Manager conversation guidance (scripted templates) — v1.0 Phase 2

### Active

- [ ] Full landing page with marketing content at `/`
- [ ] Login form for invited users
- [ ] Waitlist form with database storage
- [ ] Evolved brand identity

### Out of Scope

- Advanced provider marketplace — future expansion, not core to MVP
- Deep NHS integration — future phase, UK-first approach sufficient for now
- Predictive analytics / AI-driven absence prediction — requires data volume first
- Automation workflows — manual-first, automate after patterns are proven
- Mobile native app — web-first, responsive design sufficient for MVP
- Trigger points & Bradford Factor — deferred from v1.0 Phase 3 to v1.2+
- Analytics dashboards & reporting — deferred from v1.0 Phase 3 to v1.2+
- OH provider integration — deferred from v1.0 Phase 3 to v1.2+

## Context

- **Tech stack**: Next.js 16 (App Router), React 19, TypeScript, PostgreSQL on Supabase (direct pg, not SDK), Auth0, Tailwind/shadcn, deployed on Vercel
- **Data sensitivity**: Special category health data under UK GDPR — fit notes, GP details, conditions. Requires audit logging, data minimisation, role-based access, secure document handling
- **Authentication**: Supabase Auth with email/password for admin users. Invite-only access (no public sign up). Waitlist for prospects.
- **AI guidance**: Hybrid approach — scripted templates for MVP with architecture ready for LLM enhancement. Covers early intervention prompts, manager conversation support, return-to-work recommendations
- **Organisation model**: Admin-driven, organisation-centric. Platform admin creates orgs, org admins onboard employees via CSV import
- **Target onboarding**: Organisation setup and employee import in under 5 minutes
- **Demo moment**: Full sickness cycle — employee reports sick → manager receives guidance → return-to-work plan created and tracked to completion
- **Design direction**: Friendly, reassuring, non-clinical. Modern SaaS aesthetic with soft colours. Focus on reducing anxiety and stigma around workplace health

## Constraints

- **Tech stack**: Next.js 16 / React 19 / Auth0 / Supabase PostgreSQL / Vercel — as specified in CLAUDE.md
- **Data compliance**: UK GDPR special category data handling required from day one
- **Jurisdiction**: UK employment law and fit note conventions for MVP, but avoid hard-coding UK-specific logic
- **Reporting paths**: Both employee self-report and manager-initiated must be supported

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Magic links for employee auth | Lower friction than passwords for infrequent users; reduces onboarding steps | — Pending |
| Hybrid AI guidance | Scripted templates ship faster; architecture supports LLM later without rewrite | — Pending |
| Direct pg over Supabase SDK | More control over queries, explicit SQL, better for complex health data queries | — Pending |
| UK-first, not UK-only | Avoid hard-coding UK specifics; use abstractions that support future jurisdictions | — Pending |
| Both sickness reporting paths | Employee self-report and manager-initiated covers all real-world scenarios | — Pending |

---
*Last updated: 2026-02-16 after milestone v1.1 started*
