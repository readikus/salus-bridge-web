/**
 * Column mapping utility for CSV/Excel import.
 * Provides fuzzy matching of file headers to expected app fields
 * using an alias map, with exact-match priority over substring matching.
 */

export const APP_FIELDS = [
  { key: "first_name", label: "First Name", required: true },
  { key: "last_name", label: "Last Name", required: true },
  { key: "email", label: "Email", required: true },
  { key: "job_title", label: "Job Title", required: false },
  { key: "department", label: "Department", required: false },
  { key: "manager_email", label: "Manager Email", required: false },
] as const;

export type AppFieldKey = (typeof APP_FIELDS)[number]["key"];

/**
 * Known aliases for each app field (all lowercase).
 * Used for exact alias matching during auto-detection.
 */
const COLUMN_ALIASES: Record<AppFieldKey, string[]> = {
  first_name: ["first_name", "firstname", "first name", "fname", "given_name", "given name", "forename"],
  last_name: ["last_name", "lastname", "last name", "lname", "surname", "family_name", "family name"],
  email: [
    "email",
    "email_address",
    "emailaddress",
    "email address",
    "e-mail",
    "e_mail",
    "work_email",
    "work email",
  ],
  job_title: ["job_title", "jobtitle", "job title", "title", "position", "role", "job_role"],
  department: ["department", "dept", "dept.", "team", "division", "group", "unit"],
  manager_email: [
    "manager_email",
    "manager email",
    "manageremail",
    "manager",
    "reports_to",
    "reports to",
    "reportsto",
    "manager_email_address",
    "line_manager",
    "line manager",
  ],
};

/**
 * Find the best column mapping from file headers to app fields.
 * Priority: exact alias match > substring match.
 * Each file header can only be mapped once (first match wins).
 *
 * @param fileHeaders - Original header strings from the uploaded file
 * @returns Mapping of app field key -> original file header string (or null if no match)
 */
export function findBestColumnMapping(fileHeaders: string[]): Record<AppFieldKey, string | null> {
  const mapping: Record<AppFieldKey, string | null> = {
    first_name: null,
    last_name: null,
    email: null,
    job_title: null,
    department: null,
    manager_email: null,
  };

  // Track which file headers have been claimed
  const usedHeaders = new Set<string>();

  // Normalize headers for matching (keep originals for display)
  const normalizedHeaders = fileHeaders.map((h) => h.trim().toLowerCase());

  // Pass 1: Exact alias matches (higher priority)
  for (const field of APP_FIELDS) {
    const aliases = COLUMN_ALIASES[field.key];
    for (let i = 0; i < normalizedHeaders.length; i++) {
      const normalized = normalizedHeaders[i];
      const original = fileHeaders[i];
      if (usedHeaders.has(original)) continue;

      if (aliases.includes(normalized)) {
        mapping[field.key] = original;
        usedHeaders.add(original);
        break;
      }
    }
  }

  // Pass 2: Substring/includes matching for unmapped fields
  for (const field of APP_FIELDS) {
    if (mapping[field.key] !== null) continue; // Already matched

    const aliases = COLUMN_ALIASES[field.key];
    for (let i = 0; i < normalizedHeaders.length; i++) {
      const normalized = normalizedHeaders[i];
      const original = fileHeaders[i];
      if (usedHeaders.has(original)) continue;

      // Check if any alias is a substring of the header or vice versa
      const hasSubstringMatch = aliases.some(
        (alias) => normalized.includes(alias) || alias.includes(normalized),
      );

      if (hasSubstringMatch) {
        mapping[field.key] = original;
        usedHeaders.add(original);
        break;
      }
    }
  }

  return mapping;
}

/**
 * Apply confirmed column mapping to raw parsed rows.
 * Renames keys from original file headers to app field keys.
 *
 * @param rows - Raw parsed rows with original file header keys
 * @param mapping - Confirmed mapping: app field key -> original file header (or null)
 * @returns Rows with keys renamed to app field keys
 */
export function applyColumnMapping(
  rows: Record<string, string>[],
  mapping: Record<AppFieldKey, string | null>,
): Record<string, string>[] {
  return rows.map((row) => {
    const newRow: Record<string, string> = {};
    for (const field of APP_FIELDS) {
      const originalHeader = mapping[field.key];
      if (originalHeader !== null && originalHeader in row) {
        newRow[field.key] = row[originalHeader] ?? "";
      }
    }
    return newRow;
  });
}
