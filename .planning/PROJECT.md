# SalusBridge

## What This Is

SalusBridge is a B2B SaaS workplace health coordination platform that connects organisations, employees, managers, HR teams, and healthcare providers. It streamlines sickness reporting, return-to-work workflows, and early intervention support — with the goal of reducing friction, encouraging early action, and normalising workplace health conversations.

UK-first but designed for international expansion. Handles sensitive health data (fit notes, GP details, specific conditions) requiring special category data handling under UK GDPR.

## Core Value

An employee can report sickness and be guided through a complete return-to-work cycle — with their manager receiving structured, empathetic guidance at every step.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Platform admin can create and manage organisations
- [ ] Organisation admin can import employees via CSV with validation
- [ ] Role-based access (platform admin, org admin, manager, HR, employee)
- [ ] Employees access the platform via magic link (no password)
- [ ] Employee or manager can initiate a sickness report
- [ ] Fit note tracking and documentation
- [ ] Guided return-to-work workflow
- [ ] Manager conversation guidance (scripted templates, AI-enhanced later)
- [ ] HR compliance oversight and documentation review
- [ ] Analytics dashboard with absence trends and patterns
- [ ] External provider linking and referral workflows

### Out of Scope

- Advanced provider marketplace — future expansion, not core to MVP
- Deep NHS integration — future phase, UK-first approach sufficient for now
- Predictive analytics / AI-driven absence prediction — requires data volume first
- Automation workflows — manual-first, automate after patterns are proven
- Mobile native app — web-first, responsive design sufficient for MVP

## Context

- **Tech stack**: Next.js 16 (App Router), React 19, TypeScript, PostgreSQL on Supabase (direct pg, not SDK), Auth0, Tailwind/shadcn, deployed on Vercel
- **Data sensitivity**: Special category health data under UK GDPR — fit notes, GP details, conditions. Requires audit logging, data minimisation, role-based access, secure document handling
- **Authentication**: Auth0 with magic link flow for employees. Admin users may use email/password
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
*Last updated: 2026-02-14 after initialization*
