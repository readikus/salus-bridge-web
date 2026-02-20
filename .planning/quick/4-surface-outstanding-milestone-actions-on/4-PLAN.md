---
phase: quick-4
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - providers/repositories/milestone-action.repository.ts
  - app/api/milestone-actions/outstanding/route.ts
  - actions/milestone-actions.ts
  - components/outstanding-actions/index.tsx
  - app/(authenticated)/dashboard/page.tsx
autonomous: true
must_haves:
  truths:
    - "Manager dashboard shows real count of outstanding (pending + overdue) milestone actions"
    - "Manager dashboard displays a list of outstanding actions with employee name, milestone label, due date, and overdue indicator"
    - "Clicking an outstanding action navigates to the sickness case detail page"
    - "Dashboard still renders gracefully when there are zero outstanding actions"
  artifacts:
    - path: "app/api/milestone-actions/outstanding/route.ts"
      provides: "GET endpoint returning outstanding actions for org"
      exports: ["GET"]
    - path: "components/outstanding-actions/index.tsx"
      provides: "Outstanding actions list component for dashboard"
      exports: ["OutstandingActions"]
  key_links:
    - from: "app/(authenticated)/dashboard/page.tsx"
      to: "components/outstanding-actions/index.tsx"
      via: "Server component import"
      pattern: "OutstandingActions"
    - from: "app/(authenticated)/dashboard/page.tsx"
      to: "providers/repositories/milestone-action.repository.ts"
      via: "Direct repository call in server component"
      pattern: "MilestoneActionRepository.findOutstandingWithDetails"
---

<objective>
Surface outstanding milestone actions on the manager homepage dashboard.

Purpose: Managers currently see a hardcoded "0" for pending actions. This wires up real data so managers immediately see which milestone actions need attention across their team's sickness cases, with overdue items highlighted.

Output: Manager dashboard card shows real count and a scrollable list of outstanding actions with employee name, milestone label, due date, and overdue status. Each item links to the case detail page.
</objective>

<execution_context>
@/Users/ianread/.claude/get-shit-done/workflows/execute-plan.md
@/Users/ianread/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@providers/repositories/milestone-action.repository.ts
@app/(authenticated)/dashboard/page.tsx
@actions/milestone-actions.ts
@types/database.ts (MilestoneAction, MilestoneActionWithDetails interfaces)
@constants/permissions.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add repository method for outstanding actions with details</name>
  <files>providers/repositories/milestone-action.repository.ts</files>
  <action>
Add a new static method `findOutstandingWithDetails(organisationId: string, client?: PoolClient)` to MilestoneActionRepository that returns `MilestoneActionWithDetails[]`.

The query should:
- SELECT using the existing SELECT_COLUMNS plus milestoneLabel (from milestone_configs), employeeFirstName and employeeLastName (from users via sickness_cases -> employees -> users)
- Filter: `ma.organisation_id = $1 AND ma.status IN ('PENDING', 'IN_PROGRESS')`
- JOIN pattern: copy from `findBySicknessCaseWithDetails` — LEFT JOIN milestone_configs (matching on milestone_key and org or NULL org), LEFT JOIN sickness_cases, LEFT JOIN employees, LEFT JOIN users
- Also add `sc.id AS "caseId"` to the SELECT so the frontend can link to the case. This means the return type needs a small extension — just cast as `(MilestoneActionWithDetails & { caseId: string })[]` in the return, no new interface needed
- ORDER BY `ma.due_date ASC` so most urgent items appear first
- LIMIT 20 to keep the dashboard query fast

This follows the exact same SQL patterns as existing repository methods (parameterised queries, snake_case aliased to camelCase).
  </action>
  <verify>TypeScript compiles: `npx tsc --noEmit --pretty 2>&1 | head -20`</verify>
  <done>MilestoneActionRepository has findOutstandingWithDetails method that returns pending/in-progress actions with employee names and milestone labels for an organisation</done>
</task>

<task type="auto">
  <name>Task 2: Create outstanding actions component and wire into dashboard</name>
  <files>
    components/outstanding-actions/index.tsx
    app/(authenticated)/dashboard/page.tsx
  </files>
  <action>
**Component: `components/outstanding-actions/index.tsx`**

Create a Server Component (no 'use client') with named export `OutstandingActions`.

Props interface:
```typescript
interface Props {
  actions: (MilestoneActionWithDetails & { caseId: string })[];
}
```

Rendering:
- If actions.length === 0: show the existing "No actions required" message style (text-xs text-gray-500)
- If actions exist: render a compact list (max-h-64 overflow-y-auto) where each item is a Link to `/sickness/${action.caseId}` with:
  - Employee name: `${employeeFirstName} ${employeeLastName}` (handle nulls gracefully, show "Unknown employee" fallback)
  - Milestone label (from milestoneLabel field)
  - Due date formatted with `toLocaleDateString('en-GB')`
  - Overdue badge: if `new Date(action.dueDate) < new Date()` (comparing date-only), show a small red "Overdue" badge using `text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded`
  - Due soon indicator: if due within 2 days, show amber "Due soon" badge with `text-amber-600 bg-amber-50`
- Each row: flex layout, border-b last:border-b-0, py-2, hover:bg-gray-50 transition
- Use lucide-react `AlertCircle` icon (h-3 w-3) next to overdue items

Import from lucide-react and Link from next/link. Import MilestoneActionWithDetails from @/types/database.

**Dashboard: `app/(authenticated)/dashboard/page.tsx`**

In the manager dashboard section (the `if (isManager && organisationId)` block):

1. Import `MilestoneActionRepository` and `TenantService` and `OutstandingActions` component
2. After the existing team absence count fetch, add a new data fetch:
```typescript
let outstandingActions: (MilestoneActionWithDetails & { caseId: string })[] = [];
try {
  outstandingActions = await TenantService.withTenant(organisationId, false, async (client) => {
    return MilestoneActionRepository.findOutstandingWithDetails(organisationId, client);
  });
} catch {
  // Silently handle
}
```
3. Replace the hardcoded Pending Actions Card. Keep the same Card/CardHeader/CardContent structure and FileText icon. Change:
   - The count from `0` to `{outstandingActions.length}`
   - The description from `"No actions required"` to `{outstandingActions.length === 0 ? "No actions required" : `${outstandingActions.filter(a => new Date(a.dueDate) < new Date()).length} overdue`}`
   - Below CardContent, add `<OutstandingActions actions={outstandingActions} />` inside the Card

4. Also show outstanding actions in the org admin/HR dashboard. Add the same data fetch in the `if ((isOrgAdmin || isHR) && organisationId)` block and add a new Card after the existing 4 cards in the grid, spanning full width on a new row below:
```tsx
{outstandingActions.length > 0 && (
  <div className="col-span-full">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Outstanding Actions</CardTitle>
        <FileText className="h-4 w-4 text-gray-500" />
      </CardHeader>
      <CardContent>
        <OutstandingActions actions={outstandingActions} />
      </CardContent>
    </Card>
  </div>
)}
```

Do NOT add a separate API route or client action — this is all server-side rendering. The dashboard is already a Server Component that fetches data directly.
  </action>
  <verify>
    1. `npx tsc --noEmit --pretty 2>&1 | head -30` — no type errors
    2. `npx next build 2>&1 | tail -20` — build succeeds
  </verify>
  <done>
    - Manager dashboard shows real outstanding action count instead of hardcoded 0
    - Outstanding actions list renders below the count with employee name, milestone label, due date, and overdue/due-soon badges
    - Each action links to the sickness case detail page
    - Zero actions shows "No actions required" gracefully
    - Org admin/HR dashboard also shows outstanding actions when they exist
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. `npx next build` succeeds
3. Dashboard page server-renders without runtime errors
</verification>

<success_criteria>
- Manager dashboard Pending Actions card shows real count from milestone_actions table
- Outstanding actions displayed with employee name, milestone label, due date
- Overdue actions highlighted with red badge
- Due-soon actions (within 2 days) highlighted with amber badge
- Each action item links to `/sickness/{caseId}`
- Empty state handled gracefully
- Org admin/HR dashboard also surfaces outstanding actions
</success_criteria>

<output>
After completion, create `.planning/quick/4-surface-outstanding-milestone-actions-on/4-SUMMARY.md`
</output>
