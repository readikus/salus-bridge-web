---
phase: quick-5
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/api/triggers/route.ts
  - app/api/triggers/[id]/route.ts
  - app/api/milestones/route.ts
  - app/api/milestones/[id]/route.ts
  - actions/triggers.ts
  - actions/milestones.ts
  - app/(authenticated)/triggers/page.tsx
  - app/(authenticated)/milestones/page.tsx
autonomous: true
must_haves:
  truths:
    - "User navigating to /triggers sees trigger rules table and alerts tab"
    - "User can create, edit, and delete trigger configs from /triggers page"
    - "User can view and acknowledge trigger alerts from /triggers page"
    - "User navigating to /milestones sees milestone config cards with edit/reset"
    - "User can edit milestone overrides and reset to defaults from /milestones page"
  artifacts:
    - path: "app/api/triggers/route.ts"
      provides: "Session-scoped GET/POST for trigger configs and alerts"
    - path: "app/api/triggers/[id]/route.ts"
      provides: "Session-scoped PUT/DELETE/PATCH for trigger config and alert acknowledgement"
    - path: "app/api/milestones/route.ts"
      provides: "Session-scoped GET/POST for milestone configs"
    - path: "app/api/milestones/[id]/route.ts"
      provides: "Session-scoped PUT/DELETE for milestone config overrides"
    - path: "app/(authenticated)/triggers/page.tsx"
      provides: "Full triggers management page"
    - path: "app/(authenticated)/milestones/page.tsx"
      provides: "Full milestones configuration page"
  key_links:
    - from: "app/(authenticated)/triggers/page.tsx"
      to: "/api/triggers"
      via: "actions/triggers.ts session-scoped fetch functions"
    - from: "app/(authenticated)/milestones/page.tsx"
      to: "/api/milestones"
      via: "actions/milestones.ts session-scoped fetch functions"
---

<objective>
Replace the placeholder "coming soon" pages at /triggers and /milestones with fully functional management pages. These top-level pages are linked from the sidebar navigation and should provide the same functionality as the existing org-slug-scoped pages at /organisations/[slug]/triggers and /organisations/[slug]/milestones, but resolve the organisation from the session user's currentOrganisationId instead of a URL slug.

Purpose: Users clicking "Triggers" and "Milestones" in the sidebar currently see placeholder pages. This task makes them functional.
Output: 4 new API route files, updated action files with session-scoped functions, 2 fully functional page components.
</objective>

<execution_context>
@/Users/ianread/.claude/get-shit-done/workflows/execute-plan.md
@/Users/ianread/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Existing patterns to follow:
- @app/api/organisations/[slug]/triggers/route.ts (org-slug-scoped trigger API - mirror this but use session org ID)
- @app/api/organisations/[slug]/triggers/[id]/route.ts (org-slug-scoped trigger [id] API)
- @app/api/organisations/[slug]/milestones/route.ts (org-slug-scoped milestone API)
- @app/api/organisations/[slug]/milestones/[id]/route.ts (org-slug-scoped milestone [id] API)
- @app/api/employees/route.ts (example of session-scoped API using getAuthenticatedUser + currentOrganisationId)
- @app/(authenticated)/organisations/[slug]/triggers/page.tsx (full triggers page UI to replicate)
- @app/(authenticated)/organisations/[slug]/milestones/page.tsx (full milestones page UI to replicate)
- @actions/triggers.ts (existing slug-based action functions)
- @actions/milestones.ts (existing slug-based action functions)
- @components/trigger-config-form/index.tsx (reuse directly)
- @components/milestone-config-form/index.tsx (reuse directly)
- @components/bradford-factor-badge/index.tsx (reuse directly)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create session-scoped API routes for triggers and milestones</name>
  <files>
    app/api/triggers/route.ts
    app/api/triggers/[id]/route.ts
    app/api/milestones/route.ts
    app/api/milestones/[id]/route.ts
  </files>
  <action>
Create 4 new API route files that mirror the existing org-slug-scoped routes but resolve the organisation from the session instead of a URL slug parameter.

**Pattern to follow** (from /api/employees/route.ts):
```typescript
const sessionUser = await getAuthenticatedUser();
const organisationId = sessionUser.currentOrganisationId;
if (!organisationId) return NextResponse.json({ error: "No organisation context" }, { status: 400 });
```

Then use `organisationId` directly with TenantService.withTenant() -- no need to look up by slug.

**app/api/triggers/route.ts** - Copy logic from app/api/organisations/[slug]/triggers/route.ts:
- GET: Support ?view=alerts query param for alerts vs configs. Use PERMISSIONS.VIEW_TRIGGERS.
- POST: Create trigger config. Use PERMISSIONS.MANAGE_TRIGGERS. Validate with createTriggerConfigSchema.
- Replace `OrganisationService.getBySlug(slug)` with direct `sessionUser.currentOrganisationId`.

**app/api/triggers/[id]/route.ts** - Copy logic from app/api/organisations/[slug]/triggers/[id]/route.ts:
- PUT: Update trigger config. Validate with updateTriggerConfigSchema.
- DELETE: Delete trigger config.
- PATCH: Acknowledge trigger alert.
- All use PERMISSIONS.MANAGE_TRIGGERS (PUT/DELETE) or PERMISSIONS.VIEW_TRIGGERS (PATCH).

**app/api/milestones/route.ts** - Copy logic from app/api/organisations/[slug]/milestones/route.ts:
- GET: Return effective milestones via MilestoneService.getEffectiveMilestones(). Use PERMISSIONS.VIEW_MILESTONES.
- POST: Create/upsert milestone override via MilestoneService.upsertOrgMilestone(). Use PERMISSIONS.MANAGE_MILESTONES.

**app/api/milestones/[id]/route.ts** - Copy logic from app/api/organisations/[slug]/milestones/[id]/route.ts:
- PUT: Update milestone config via MilestoneConfigRepository.update().
- DELETE: Reset to default via MilestoneService.resetToDefault().

All routes must include AuditLogService.log() calls matching the existing patterns. All routes wrap DB calls in TenantService.withTenant(organisationId, false, ...).
  </action>
  <verify>Run `npx tsc --noEmit` to confirm no type errors in the new route files.</verify>
  <done>4 new API route files exist, each mirroring the org-slug-scoped equivalents but using session-based org resolution.</done>
</task>

<task type="auto">
  <name>Task 2: Add session-scoped actions and build the triggers and milestones pages</name>
  <files>
    actions/triggers.ts
    actions/milestones.ts
    app/(authenticated)/triggers/page.tsx
    app/(authenticated)/milestones/page.tsx
  </files>
  <action>
**Step 1: Add session-scoped action functions.**

In `actions/triggers.ts`, add new functions that call the session-scoped API routes (no slug param):
- `fetchSessionTriggerConfigs()` -> GET /api/triggers
- `createSessionTriggerConfig(data)` -> POST /api/triggers
- `updateSessionTriggerConfig(id, data)` -> PUT /api/triggers/{id}
- `deleteSessionTriggerConfig(id)` -> DELETE /api/triggers/{id}
- `fetchSessionTriggerAlerts(filters?)` -> GET /api/triggers?view=alerts&...
- `acknowledgeSessionTriggerAlert(alertId)` -> PATCH /api/triggers/{alertId}

Keep existing slug-based functions unchanged (they're used by the org-slug pages).

In `actions/milestones.ts`, add new functions:
- `fetchSessionMilestones()` -> GET /api/milestones
- `createSessionMilestoneOverride(data)` -> POST /api/milestones
- `updateSessionMilestoneOverride(id, data)` -> PUT /api/milestones/{id}
- `deleteSessionMilestoneOverride(id)` -> DELETE /api/milestones/{id}

**Step 2: Replace the triggers placeholder page.**

Replace `app/(authenticated)/triggers/page.tsx` with a full implementation that mirrors `app/(authenticated)/organisations/[slug]/triggers/page.tsx` but uses the session-scoped action functions instead of slug-based ones. Key differences:
- "use client" directive
- Import session-scoped action functions instead of slug-based ones
- Remove useParams() / slug usage
- Use React Query with queryKeys like ["session-trigger-configs"] and ["session-trigger-alerts", showOnlyUnacknowledged]
- Use useMutation calling session-scoped create/update/delete/acknowledge functions
- All UI (tabs, tables, dialogs, forms, badges) identical to the org-slug version
- Import and use TriggerConfigForm, BradfordFactorBadge components directly

**Step 3: Replace the milestones placeholder page.**

Replace `app/(authenticated)/milestones/page.tsx` with a full implementation that mirrors `app/(authenticated)/organisations/[slug]/milestones/page.tsx` but uses session-scoped action functions. Key differences:
- Remove useParams() / slug usage
- Use session-scoped action functions
- Pass slug={undefined} is NOT needed -- instead update MilestoneConfigForm usage: the form currently takes `slug` prop. Check if MilestoneConfigForm uses slug only for API calls. If so, create a wrapper or modify the form to accept an optional `onSave` callback pattern instead. If easier, just duplicate the form inline or create a session-scoped variant.
- Actually, the simplest approach: check MilestoneConfigForm. If it directly calls the slug-based actions internally, then in the milestones page, handle save/cancel at the page level and pass the form the milestone data + callbacks. If the form component accepts onSave/onCancel callbacks, just wire them to session-scoped actions.
- All UI (cards, badges, edit dialog, reset button) identical to org-slug version
  </action>
  <verify>Run `npx tsc --noEmit` to confirm no type errors. Visually inspect by running `yarn dev` and navigating to /triggers and /milestones pages.</verify>
  <done>Both /triggers and /milestones pages show full management UIs instead of "coming soon" placeholders. Users can create/edit/delete trigger rules, view/acknowledge alerts, and configure/reset milestone overrides.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with no errors
- /triggers page loads and shows trigger rules tab and alerts tab
- /milestones page loads and shows milestone config cards
- No regressions on /organisations/[slug]/triggers or /organisations/[slug]/milestones pages (slug-based actions untouched)
</verification>

<success_criteria>
- Both placeholder pages replaced with functional implementations
- Session-scoped API routes correctly resolve org from session user
- All CRUD operations work: create/edit/delete triggers, acknowledge alerts, edit/reset milestones
- Existing org-slug-scoped routes and pages unaffected
</success_criteria>

<output>
After completion, create `.planning/quick/5-build-the-triggers-and-milestone-pages/5-SUMMARY.md`
</output>
