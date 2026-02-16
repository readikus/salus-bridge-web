import { z } from "zod";

/**
 * Schema for CSV file upload validation.
 */
const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

export const CsvFileSchema = z.object({
  fileName: z.string().refine(
    (name) => ACCEPTED_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext)),
    { message: "File must be a .csv, .xlsx, or .xls file" },
  ),
  fileSize: z.number().max(5 * 1024 * 1024, "File must be under 5MB"),
});

/**
 * Schema for validating each row of the CSV import.
 * Matches the employee fields defined in CONTEXT.md: name, email, job title, department, manager.
 */
export const CsvRowSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address").max(255),
  job_title: z.string().max(200).optional().default(""),
  department: z.string().max(200).optional().default(""),
  manager_email: z.string().email("Invalid manager email").max(255).optional().default(""),
});

export type CsvRowInput = z.infer<typeof CsvRowSchema>;

/**
 * Required CSV column headers (case-insensitive matching).
 */
export const REQUIRED_CSV_COLUMNS = ["first_name", "last_name", "email"] as const;
export const OPTIONAL_CSV_COLUMNS = ["job_title", "department", "manager_email"] as const;
export const ALL_CSV_COLUMNS = [...REQUIRED_CSV_COLUMNS, ...OPTIONAL_CSV_COLUMNS] as const;

/**
 * Types for CSV import results.
 */
export interface ValidatedRow {
  rowNumber: number;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: string;
  managerEmail: string;
}

export interface ErrorRow {
  rowNumber: number;
  data: Record<string, string>;
  errors: string[];
}

export interface SkippedRow {
  rowNumber: number;
  email: string;
  reason: string;
}

export interface UnmatchedManager {
  rowNumber: number;
  employeeEmail: string;
  managerEmail: string;
}

export interface CsvValidationResult {
  validRows: ValidatedRow[];
  errorRows: ErrorRow[];
  skippedDuplicates: SkippedRow[];
  unmatchedManagers: UnmatchedManager[];
  totalRows: number;
}

export interface ImportResultEmployee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface ImportResult {
  created: ImportResultEmployee[];
  skippedDuplicates: SkippedRow[];
  errors: ErrorRow[];
  unmatchedManagers: UnmatchedManager[];
  totalRows: number;
}

/**
 * Column mapping type: app field key -> original file header (or null if unmapped).
 */
export type ColumnMapping = Record<string, string | null>;

/**
 * Payload for JSON-based import with pre-parsed rows and confirmed column mapping.
 */
export interface MappedImportPayload {
  rows: Record<string, string>[];
  mapping: Record<string, string>;
}
