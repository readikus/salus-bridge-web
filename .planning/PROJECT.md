# SalusBridge

## What This Is

SalusBridge is a B2B SaaS workplace health coordination platform that connects organisations, employees, managers, HR teams, and healthcare providers. It streamlines sickness reporting, return-to-work workflows, and early intervention support — with the goal of reducing friction, encouraging early action, and normalising workplace health conversations.

UK-first but designed for international expansion. Handles sensitive health data (fit notes, GP details, specific conditions) requiring special category data handling under UK GDPR.

## Core Value

An employee can report sickness and be guided through a complete return-to-work cycle — with their manager receiving structured, empathetic guidance at every step.

## Current Milestone: v1.2 Absence Timeline Engine

**Goal:** A configurable milestone-based workflow engine that automatically drives absence management — from Day 1 notifications through Week 52 capability review — with a compliance dashboard showing real-time risk status across all active cases.

**Target features:**
- Configurable absence timeline with auto-triggered milestone actions (Day 1, 3, 7, Week 2-4, 6, every 4 weeks, Week 52)
- Communication log on sickness cases for tracking all employer-employee contact
- Compliance dashboard with red/yellow/green risk indicators per case
- GP details storage and medical records consent workflow
- Org-level override of default milestone timings

## Requirements

### Validated

- ✓ Platform admin can create and manage organisations — v1.0 Phase 1
- ✓ Organisation admin can import employees via CSV with validation — v1.0 Phase 1
- ✓ Role-based access (platform admin, org admin, manager, HR, employee) — v1.0 Phase 1
- ✓ Employee or manager can initiate a sickness report — v1.0 Phase 2
- ✓ Fit note tracking and documentation — v1.0 Phase 2
- ✓ Guided return-to-work workflow — v1.0 Phase 2
- ✓ Manager conversation guidance (scripted templates) — v1.0 Phase 2
- ✓ Trigger points & Bradford Factor with alert notifications — v1.0 Phase 3
- ✓ Analytics dashboard with cohort privacy and CSV/PDF export — v1.0 Phase 3
- ✓ OH provider integration with referral lifecycle — v1.0 Phase 3
- ✓ Landing page with marketing content — v1.1

### Active

- [ ] Configurable absence timeline engine with milestone-based actions
- [ ] Communication log on sickness cases
- [ ] Compliance dashboard with risk indicators
- [ ] GP details and medical records consent
- [ ] Document templates (GP report request, Plan of Action, meeting forms, BTW report) — v1.3
- [ ] Plan of Action with collaborative sign-off — v1.3
- [ ] Auto-scheduled evaluation meetings — v1.3
- [ ] Reintegration report generator — v1.3
- [ ] Capability review at Week 52 — v1.3

### Out of Scope

- Advanced provider marketplace — future expansion, not core to MVP
- Deep NHS integration — future phase, UK-first approach sufficient for now
- Predictive analytics / AI-driven absence prediction — requires data volume first
- Mobile native app — web-first, responsive design sufficient for MVP
- HRIS integration API — explicitly out of scope per founder discussion
- Org-customisable document templates — standard templates only for now

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
*Last updated: 2026-02-18 after milestone v1.2 started*
