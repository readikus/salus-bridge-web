---
phase: quick
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - utils/column-mapping.ts
  - components/csv-import-wizard/index.tsx
  - components/csv-import-wizard/column-mapping-step.tsx
  - schemas/csv-import.ts
  - actions/employees.ts
  - app/api/employees/import/route.ts
  - providers/services/csv-import.service.ts
autonomous: true
must_haves:
  truths:
    - "User can upload .csv, .xlsx, or .xls files via the import wizard"
    - "After upload, user sees a column mapping screen with detected columns matched to app fields"
    - "User can override any auto-detected mapping via dropdown selects"
    - "Required fields (first_name, last_name, email) must be mapped before user can proceed"
    - "Fuzzy matching correctly maps common aliases like 'Surname' -> last_name, 'Email Address' -> email"
    - "Import proceeds with user-confirmed column mappings applied to the data"
  artifacts:
    - path: "utils/column-mapping.ts"
      provides: "Fuzzy matching utility and alias map"
    - path: "components/csv-import-wizard/column-mapping-step.tsx"
      provides: "Column mapping confirmation UI"
    - path: "components/csv-import-wizard/index.tsx"
      provides: "Updated wizard with mapping step and Excel support"
  key_links:
    - from: "components/csv-import-wizard/index.tsx"
      to: "utils/column-mapping.ts"
      via: "import and call findBestColumnMapping()"
    - from: "components/csv-import-wizard/index.tsx"
      to: "components/csv-import-wizard/column-mapping-step.tsx"
      via: "renders ColumnMappingStep in 'mapping' wizard step"
    - from: "components/csv-import-wizard/index.tsx"
      to: "app/api/employees/import/route.ts"
      via: "sends JSON body with rows + columnMapping instead of FormData CSV"
---

<objective>
Add Excel (.xlsx/.xls) support and a smart column mapping confirmation screen to the CSV import wizard. After file upload, the wizard auto-detects column mappings using fuzzy matching against known aliases, shows a confirmation screen where users can override mappings via dropdowns, then proceeds to import with the confirmed mappings.

Purpose: Users importing employee data from various HR systems have inconsistent column naming. This eliminates import failures from mismatched headers and adds Excel support -- the most common export format.

Output: Updated import wizard with 4 steps (upload -> mapping -> importing -> results), fuzzy column matcher utility, Excel parsing via xlsx library.
</objective>

<execution_context>
@/Users/ianread/.claude/get-shit-done/workflows/execute-plan.md
@/Users/ianread/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@components/csv-import-wizard/index.tsx
@providers/services/csv-import.service.ts
@schemas/csv-import.ts
@app/api/employees/import/route.ts
@actions/employees.ts
@app/(authenticated)/employees/import/page.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Column mapping utility, Excel parsing setup, and schema updates</name>
  <files>
    utils/column-mapping.ts
    schemas/csv-import.ts
    actions/employees.ts
    app/api/employees/import/route.ts
    providers/services/csv-import.service.ts
  </files>
  <action>
**1. Install dependencies:**
- Run `yarn add xlsx` to add SheetJS for Excel parsing (used client-side to convert xlsx/xls to row arrays).
- Run `npx shadcn@latest add select` to add the shadcn Select component (needed for mapping dropdowns).

**2. Create `utils/column-mapping.ts`:**

Define the expected app fields and an alias map for fuzzy matching:

```ts
export const APP_FIELDS = [
  { key: "first_name", label: "First Name", required: true },
  { key: "last_name", label: "Last Name", required: true },
  { key: "email", label: "Email", required: true },
  { key: "job_title", label: "Job Title", required: false },
  { key: "department", label: "Department", required: false },
  { key: "manager_email", label: "Manager Email", required: false },
] as const;

export type AppFieldKey = (typeof APP_FIELDS)[number]["key"];
```

Define a `COLUMN_ALIASES` map: each app field key maps to an array of known aliases (all lowercase). Examples:
- `first_name`: `["first_name", "firstname", "first name", "fname", "given_name", "given name", "forename"]`
- `last_name`: `["last_name", "lastname", "last name", "lname", "surname", "family_name", "family name"]`
- `email`: `["email", "email_address", "emailaddress", "email address", "e-mail", "e_mail", "work_email", "work email"]`
- `job_title`: `["job_title", "jobtitle", "job title", "title", "position", "role", "job_role"]`
- `department`: `["department", "dept", "dept.", "team", "division", "group", "unit"]`
- `manager_email`: `["manager_email", "manager email", "manageremail", "manager", "reports_to", "reports to", "reportsto", "manager_email_address", "line_manager", "line manager"]`

Export `findBestColumnMapping(fileHeaders: string[]): Record<AppFieldKey, string | null>`:
- For each app field, normalize each file header (trim, lowercase) and check against aliases.
- If exact alias match found, map it. If no exact match, try substring/includes matching (e.g., header "employee_email" contains "email").
- Each file header can only be mapped once (first match wins, prioritize exact alias matches over substring).
- Return a mapping object: `{ first_name: "First Name", last_name: "Surname", email: null, ... }` where values are the ORIGINAL (un-normalized) file header strings, or null if no match found.

Export `applyColumnMapping(rows: Record<string, string>[], mapping: Record<AppFieldKey, string | null>): Record<string, string>[]`:
- Takes raw parsed rows and the confirmed mapping, returns rows with keys renamed to app field keys.
- For each row, create a new object where for each app field that has a non-null mapping, copy `row[originalHeader]` to `newRow[appFieldKey]`.

**3. Update `schemas/csv-import.ts`:**
- Update `CsvFileSchema` to accept `.csv`, `.xlsx`, `.xls` extensions (not just `.csv`).
- Add a `ColumnMapping` type: `Record<string, string | null>` (app field key -> original header or null).
- Add a `MappedImportPayload` interface: `{ rows: Record<string, string>[]; mapping: Record<string, string> }` -- this is what the client will POST as JSON.

**4. Update `actions/employees.ts` -- add new action function:**
- Add `fetchImportEmployeesWithMapping(rows: Record<string, string>[], mapping: Record<string, string>): Promise<ImportResult>`.
- This POSTs JSON `{ rows, mapping }` to `/api/employees/import` with `Content-Type: application/json`.
- Keep the old `fetchImportEmployees(file: File)` function for backward compatibility but it will no longer be called by the wizard.

**5. Update `app/api/employees/import/route.ts`:**
- The POST handler should detect the Content-Type: if `application/json`, parse the JSON body as `MappedImportPayload`; if `multipart/form-data`, use existing CSV file parsing logic (backward compat).
- For the JSON path: receive `{ rows, mapping }`, apply `applyColumnMapping(rows, mapping)` to get normalized rows, then convert to CSV-like format string (or better: add a new method to CsvImportService that accepts pre-parsed row arrays instead of raw CSV text).

**6. Update `providers/services/csv-import.service.ts`:**
- Add a new static method `parseAndValidateRows(rows: Record<string, string>[], organisationId: string): Promise<CsvValidationResult>` that takes pre-parsed, already-column-mapped rows (with app field keys) and runs the same validation logic as `parseAndValidate` but skips the PapaParse step.
- Extract the row validation loop from `parseAndValidate` into a shared private method to avoid duplication.
  </action>
  <verify>
- `yarn tsc --noEmit` passes with no type errors
- `utils/column-mapping.ts` exports `findBestColumnMapping`, `applyColumnMapping`, `APP_FIELDS`, `AppFieldKey`
- API route handles both JSON and FormData content types
  </verify>
  <done>
Column mapping utility correctly maps common aliases (e.g., "Surname" -> last_name, "Email Address" -> email). API route accepts JSON payload with rows + mapping. CsvImportService can validate pre-parsed rows. xlsx package installed. shadcn Select component available.
  </done>
</task>

<task type="auto">
  <name>Task 2: Column mapping UI component and wizard integration with Excel support</name>
  <files>
    components/csv-import-wizard/column-mapping-step.tsx
    components/csv-import-wizard/index.tsx
  </files>
  <action>
**1. Create `components/csv-import-wizard/column-mapping-step.tsx`:**

Props interface:
```ts
interface Props {
  fileHeaders: string[];                          // Original headers from the uploaded file
  detectedMapping: Record<AppFieldKey, string | null>;  // Auto-detected mapping from fuzzy matcher
  sampleRows: Record<string, string>[];           // First 3 rows for preview
  onConfirm: (mapping: Record<AppFieldKey, string | null>) => void;
  onBack: () => void;
}
```

Component renders a Card with:
- Title: "Map Columns" and description: "We detected your file's columns. Please verify the mappings below."
- A list/table of all APP_FIELDS. For each field:
  - Left side: field label + required badge (use Badge component with "Required" text for required fields)
  - Right side: a shadcn Select dropdown populated with all `fileHeaders` as options, plus a "-- Not mapped --" option (value: empty string).
  - Pre-selected with the auto-detected mapping value (or "Not mapped" if null).
  - Below the select, show a small preview of the first value from sampleRows for the currently selected header (in muted text, e.g., "Preview: john@example.com") so user can verify the mapping is correct.
- If any required field is not mapped, show a warning message and disable the "Continue" button.
- Footer with "Back" button (calls onBack) and "Continue Import" button (calls onConfirm with current mapping state).

Use internal state `useState<Record<AppFieldKey, string | null>>` initialized from `detectedMapping`. When user changes a select, update state. Prevent the same file header from being selected for multiple fields -- if a header is already used by another field, either show it as disabled/greyed in other dropdowns, or auto-clear the previous field's mapping (prefer showing as disabled with a "(used)" suffix).

Style with Tailwind: use a clean two-column layout within the card. Each mapping row should have slight padding/border-bottom for visual separation. Use `text-sm text-muted-foreground` for preview text.

**2. Update `components/csv-import-wizard/index.tsx`:**

Major changes to the wizard:

a. **Add xlsx import** at top: `import * as XLSX from "xlsx"`. Add `import { findBestColumnMapping, applyColumnMapping, APP_FIELDS, AppFieldKey } from "@/utils/column-mapping"`. Import the new `fetchImportEmployeesWithMapping` from actions. Import `ColumnMappingStep` from `./column-mapping-step`.

b. **Update WizardStep type** to: `"upload" | "mapping" | "importing" | "results"`.

c. **Add new state:**
- `parsedHeaders: string[]` -- headers extracted from the file
- `parsedRows: Record<string, string>[]` -- all data rows from the file
- `columnMapping: Record<AppFieldKey, string | null>` -- the confirmed column mapping

d. **Update `handleFileSelect`:**
- Accept `.csv`, `.xlsx`, `.xls` files (not just `.csv`).
- Update the file input `accept` attribute to `.csv,.xlsx,.xls`.
- Update the drop zone text from "CSV files only" to "CSV or Excel files, max 5MB".
- Update the CardTitle from "Import Employees from CSV" to "Import Employees".
- Update the CardDescription to mention CSV and Excel.

e. **Add `handleFileParse` function** (called when user clicks "Continue" after selecting a file, replaces the old immediate import):
- If file is `.csv`: use PapaParse (import Papa from "papaparse") to parse client-side with `header: true, skipEmptyLines: true` (do NOT use transformHeader -- keep original headers for display). Store `parsed.meta.fields` as `parsedHeaders` and `parsed.data` as `parsedRows`.
- If file is `.xlsx` or `.xls`: use `XLSX.read()` to parse the file (read as ArrayBuffer via `file.arrayBuffer()`), get the first sheet, use `XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { raw: false, defval: "" })` to get rows. Extract headers from the first row keys. Store as `parsedHeaders` and `parsedRows`.
- After parsing, call `findBestColumnMapping(parsedHeaders)` and store result in `columnMapping`.
- Set step to `"mapping"`.

f. **Update upload step UI:**
- Change the "Import Employees" button to "Continue" (it now goes to mapping, not directly to import).
- The button calls `handleFileParse` instead of `handleImport`.

g. **Add mapping step rendering** (when `step === "mapping"`):
- Render `<ColumnMappingStep>` with `fileHeaders={parsedHeaders}`, `detectedMapping={columnMapping}`, `sampleRows={parsedRows.slice(0, 3)}`, `onConfirm` handler that stores the confirmed mapping and calls the import, `onBack` handler that returns to upload step.

h. **Update `handleImport`** (now called from mapping step's onConfirm):
- Receives the confirmed mapping as parameter.
- Calls `applyColumnMapping(parsedRows, confirmedMapping)` to get normalized rows.
- Calls `fetchImportEmployeesWithMapping(normalizedRows, confirmedMapping)` instead of `fetchImportEmployees(file)`.
- Rest of the flow (setting step to "importing", then "results") stays the same.

i. **Update the CSV template guide** at the bottom of the upload step to also mention Excel files are supported.

j. **Update `handleReset`** to clear the new state (parsedHeaders, parsedRows, columnMapping).
  </action>
  <verify>
- `yarn tsc --noEmit` passes
- `yarn build` completes without errors
- The wizard renders with 4 steps: upload (accepts csv/xlsx/xls) -> mapping (shows detected columns with dropdowns) -> importing -> results
- Required fields show "Required" badge and block continue if unmapped
- Preview values show below each mapping dropdown
  </verify>
  <done>
Complete import wizard with: (1) file upload accepting CSV and Excel files, (2) column mapping screen with fuzzy-matched pre-selections and override dropdowns showing preview data, (3) required field validation blocking progress, (4) confirmed mappings applied to data before import. The old direct-CSV-upload path still works via the API's FormData fallback.
  </done>
</task>

</tasks>

<verification>
- Upload a CSV with non-standard headers (e.g., "First Name", "Surname", "Email Address", "Position", "Team", "Line Manager Email") -- mapping screen should auto-detect all 6 fields correctly
- Upload an .xlsx file -- should parse and show mapping screen identically to CSV
- Leave a required field unmapped -- Continue button should be disabled with warning
- Override a mapping via dropdown -- import should use the overridden mapping
- Full import flow completes with created/skipped/error counts shown on results screen
- `yarn tsc --noEmit` and `yarn build` pass
</verification>

<success_criteria>
- Excel (.xlsx/.xls) and CSV files all accepted by the upload step
- Fuzzy matching correctly maps at least: "First Name", "Surname"/"Last Name", "Email"/"Email Address", "Title"/"Position", "Dept"/"Team", "Manager"/"Reports To" to their respective app fields
- Column mapping confirmation screen shows all 6 app fields with Select dropdowns pre-populated from fuzzy matching
- Required fields enforced -- cannot proceed without first_name, last_name, email mapped
- Data preview (first row value) shown for each mapped column
- Same header cannot be mapped to multiple fields
- Import completes successfully using confirmed mappings
</success_criteria>

<output>
After completion, create `.planning/quick/1-smart-column-mapping-ui-for-csv-excel-im/1-SUMMARY.md`
</output>
