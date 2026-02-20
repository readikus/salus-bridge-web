---
phase: quick-6
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - database/migrations/20260220100001_create_milestone_guidance.ts
  - providers/repositories/milestone-guidance.repository.ts
  - providers/services/milestone.service.ts
  - components/case-timeline/index.tsx
  - types/database.ts
autonomous: true
must_haves:
  truths:
    - "Milestone guidance data is stored in and served from the database"
    - "Components display guidance fetched from DB, not hardcoded constant"
    - "Hardcoded MILESTONE_GUIDANCE constant is retained as fallback"
  artifacts:
    - path: "database/migrations/20260220100001_create_milestone_guidance.ts"
      provides: "milestone_guidance table with seeded data"
      contains: "CREATE TABLE milestone_guidance"
    - path: "providers/repositories/milestone-guidance.repository.ts"
      provides: "DB access for milestone guidance"
      exports: ["MilestoneGuidanceRepository"]
    - path: "providers/services/milestone.service.ts"
      provides: "getGuidanceForMilestone method with DB-first, fallback pattern"
  key_links:
    - from: "components/case-timeline/index.tsx"
      to: "providers/services/milestone.service.ts"
      via: "API route or direct service call"
      pattern: "guidance.*milestoneKey"
---

<objective>
Migrate milestone guidance content from the hardcoded MILESTONE_GUIDANCE constant to a database-managed `milestone_guidance` table, following the same pattern used for milestone_configs (DB-first with hardcoded fallback).

Purpose: Enable future per-organisation customisation of guidance text, and centralise content management in the database.
Output: New migration, repository, service method, and updated consumer component.
</objective>

<execution_context>
@/Users/ianread/.claude/get-shit-done/workflows/execute-plan.md
@/Users/ianread/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@constants/milestone-guidance.ts
@providers/repositories/milestone-config.repository.ts
@providers/services/milestone.service.ts
@database/migrations/20260218000001_create_milestone_configs.ts
@components/case-timeline/index.tsx
@types/database.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create milestone_guidance table, repository, and service method</name>
  <files>
    database/migrations/20260220100001_create_milestone_guidance.ts
    providers/repositories/milestone-guidance.repository.ts
    providers/services/milestone.service.ts
    types/database.ts
  </files>
  <action>
    1. Add a `MilestoneGuidance` interface to `types/database.ts`:
       - id: string
       - organisationId: string | null (nullable for system defaults, same pattern as milestone_configs)
       - milestoneKey: string
       - actionTitle: string
       - managerGuidance: string
       - suggestedText: string
       - instructions: string[] (stored as JSONB in DB)
       - employeeView: string
       - isDefault: boolean
       - createdAt: Date
       - updatedAt: Date

    2. Create migration `database/migrations/20260220100001_create_milestone_guidance.ts`:
       - Follow the exact pattern of `20260218000001_create_milestone_configs.ts`
       - CREATE TABLE milestone_guidance with columns:
         id UUID PK DEFAULT gen_random_uuid(),
         organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE (nullable),
         milestone_key VARCHAR(50) NOT NULL,
         action_title VARCHAR(200) NOT NULL,
         manager_guidance TEXT NOT NULL,
         suggested_text TEXT NOT NULL,
         instructions JSONB NOT NULL DEFAULT '[]',
         employee_view TEXT NOT NULL,
         is_default BOOLEAN DEFAULT false,
         created_at TIMESTAMPTZ DEFAULT now(),
         updated_at TIMESTAMPTZ DEFAULT now()
       - Indexes: idx_milestone_guidance_org ON (organisation_id), idx_milestone_guidance_key ON (milestone_key)
       - Unique constraint: uq_milestone_guidance_org_key ON (organisation_id, milestone_key)
       - Partial unique index for NULL-scoped uniqueness: idx_milestone_guidance_default_key ON (milestone_key) WHERE organisation_id IS NULL
       - RLS: ENABLE ROW LEVEL SECURITY, same policy as milestone_configs (org_isolation with NULL visibility for defaults and platform admin bypass)
       - GRANT SELECT ON milestone_guidance TO authenticated (read-only for now)
       - Seed all 19 entries from the MILESTONE_GUIDANCE constant as system defaults (organisation_id IS NULL, is_default = true). Use a single INSERT with VALUES for all entries. The `instructions` arrays must be inserted as JSON arrays (e.g., '["item1","item2"]'::jsonb). Copy text exactly from constants/milestone-guidance.ts.

    3. Create `providers/repositories/milestone-guidance.repository.ts`:
       - Follow the exact pattern of `milestone-config.repository.ts` (static class methods, pool.query, snake_case aliased to camelCase, optional PoolClient parameter)
       - SELECT_COLUMNS: map all columns with aliases (organisation_id AS "organisationId", milestone_key AS "milestoneKey", action_title AS "actionTitle", manager_guidance AS "managerGuidance", suggested_text AS "suggestedText", employee_view AS "employeeView", is_default AS "isDefault", created_at AS "createdAt", updated_at AS "updatedAt")
       - Methods:
         - `findDefaults(client?)`: SELECT WHERE organisation_id IS NULL AND is_default = true, ORDER BY milestone_key
         - `findByOrganisation(orgId, client?)`: SELECT WHERE organisation_id = $1
         - `findByMilestoneKey(milestoneKey, orgId?, client?)`: Returns guidance for a specific milestone. If orgId provided, check org override first, fall back to default. Use: SELECT ... WHERE milestone_key = $1 AND (organisation_id = $2 OR organisation_id IS NULL) ORDER BY organisation_id DESC NULLS LAST LIMIT 1

    4. Add a static method to `MilestoneService`:
       - `getGuidanceForMilestone(milestoneKey: string, organisationId?: string, client?: PoolClient)`: Returns MilestoneGuidance (from types/database) or the hardcoded fallback
       - Pattern: Try DB via MilestoneGuidanceRepository.findByMilestoneKey(milestoneKey, organisationId). If found, return it. If not found, fall back to MILESTONE_GUIDANCE[milestoneKey] from constants/milestone-guidance.ts (same fallback pattern as getEffectiveMilestones uses DEFAULT_MILESTONES)
       - `getGuidanceMap(milestoneKeys: string[], organisationId?: string, client?: PoolClient)`: Returns Record<string, MilestoneGuidance> for multiple keys in one call. Fetches all defaults from DB, overlays org overrides if orgId provided, falls back to hardcoded constant for any missing keys. This is the bulk method the timeline component will use.
  </action>
  <verify>
    - `npx tsc --noEmit` passes (no type errors)
    - Migration file exists and has correct structure with all 19 seed entries
    - Repository file follows existing patterns (compare with milestone-config.repository.ts)
  </verify>
  <done>
    - milestone_guidance table migration exists with schema, indexes, RLS, and all 19 seeded entries
    - MilestoneGuidanceRepository has findDefaults, findByOrganisation, findByMilestoneKey methods
    - MilestoneService has getGuidanceForMilestone and getGuidanceMap methods with DB-first + hardcoded fallback
    - MilestoneGuidance type added to types/database.ts
  </done>
</task>

<task type="auto">
  <name>Task 2: Update case-timeline component to fetch guidance from DB via API</name>
  <files>
    app/api/sickness-cases/[id]/milestone-guidance/route.ts
    actions/milestone-actions.ts
    components/case-timeline/index.tsx
  </files>
  <action>
    1. Create API route `app/api/sickness-cases/[id]/milestone-guidance/route.ts`:
       - GET handler that accepts sickness case ID from params
       - Extract session user and organisation from auth context (follow pattern of existing sickness-case API routes)
       - Call MilestoneService.getGuidanceMap() with milestone keys from the case timeline and the organisation ID
       - Return the guidance map as JSON
       - Use TenantService.withTenant() for RLS context (follow existing API route patterns)

    2. Add a fetch action to `actions/milestone-actions.ts`:
       - `fetchMilestoneGuidance(caseId: string)`: Calls GET /api/sickness-cases/{caseId}/milestone-guidance, returns Record<string, MilestoneGuidance>
       - Follow existing fetch action patterns in this file (fetch wrapper, typed response)

    3. Update `components/case-timeline/index.tsx`:
       - Remove the import of MILESTONE_GUIDANCE constant from constants/milestone-guidance.ts
       - Keep importing the MilestoneGuidance TYPE (it will match the DB type shape)
       - Add state: `const [guidanceMap, setGuidanceMap] = useState<Record<string, MilestoneGuidance>>({})`
       - In the existing loadData function (or alongside it), call fetchMilestoneGuidance(caseId) and set the guidance map state
       - Change the MilestoneCard guidance prop from `MILESTONE_GUIDANCE[entry.milestone.milestoneKey]` to `guidanceMap[entry.milestone.milestoneKey]`
       - Import the MilestoneGuidance type from types/database.ts instead of constants/milestone-guidance.ts (the interface shape is identical: actionTitle, managerGuidance, suggestedText, instructions, employeeView)
       - Do NOT delete constants/milestone-guidance.ts -- it remains as the fallback source used by MilestoneService

    Note: The MilestoneGuidance interface in types/database.ts has additional DB fields (id, organisationId, etc.) but the component only uses actionTitle, managerGuidance, suggestedText, instructions, employeeView. The MilestoneCardProps guidance prop type should use `Partial<MilestoneGuidance>` or a pick type with just the fields it needs, OR simply keep using the original MilestoneGuidance interface from constants/milestone-guidance.ts as the prop type (since the DB type is a superset). Simplest approach: define a `MilestoneGuidanceContent` type (pick of the 5 content fields) and use that for the prop. Export it from the constants file or types/database.ts.
  </action>
  <verify>
    - `npx tsc --noEmit` passes
    - The case-timeline component no longer directly imports MILESTONE_GUIDANCE constant for rendering (only the type may be imported)
    - The new API route file exists at app/api/sickness-cases/[id]/milestone-guidance/route.ts
    - The fetch action exists in actions/milestone-actions.ts
  </verify>
  <done>
    - Case timeline fetches guidance from DB via API route instead of using hardcoded constant
    - API route returns guidance map keyed by milestone key
    - Hardcoded constant preserved in constants/milestone-guidance.ts as fallback (used by MilestoneService.getGuidanceMap)
    - No visual changes to the UI -- same guidance content displayed
  </done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with no type errors
- Migration file contains all 19 milestone guidance entries matching the hardcoded constant
- Repository follows the static class method + pool.query pattern
- Service uses DB-first with hardcoded fallback (same pattern as milestone configs)
- Component fetches guidance from API, not from hardcoded import
- constants/milestone-guidance.ts is preserved as fallback
</verification>

<success_criteria>
- milestone_guidance table migration exists with correct schema, RLS, and all 19 seeded entries
- MilestoneGuidanceRepository provides DB access with standard repository pattern
- MilestoneService.getGuidanceMap returns DB guidance with hardcoded fallback
- case-timeline component fetches guidance via API route, not from constants import
- TypeScript compiles without errors
</success_criteria>

<output>
After completion, create `.planning/quick/6-migrate-milestone-guidance-from-hardcode/6-SUMMARY.md`
</output>
