import Papa from "papaparse";
import { EmployeeRepository } from "@/providers/repositories/employee.repository";
import { UserRepository } from "@/providers/repositories/user.repository";
import { UserRoleRepository } from "@/providers/repositories/user-role.repository";
import { DepartmentRepository } from "@/providers/repositories/department.repository";
import { AuditLogService } from "@/providers/services/audit-log.service";
import {
  CsvRowSchema,
  REQUIRED_CSV_COLUMNS,
  ALL_CSV_COLUMNS,
  ValidatedRow,
  ErrorRow,
  SkippedRow,
  UnmatchedManager,
  CsvValidationResult,
  ImportResult,
  ImportResultEmployee,
} from "@/schemas/csv-import";
import { AuditAction, AuditEntity, UserRole, EmployeeStatus } from "@/types/enums";

/**
 * CSV Import Service -- handles parsing, validation, duplicate detection,
 * manager linking, and bulk employee import (ORG-01).
 */
export class CsvImportService {
  /**
   * Validate a single row against the CsvRowSchema and check for duplicates.
   * Shared between parseAndValidate (CSV) and parseAndValidateRows (pre-parsed).
   */
  private static async validateRow(
    rawRow: Record<string, string>,
    rowNumber: number,
    organisationId: string,
    seenEmails: Set<string>,
    allRows: Record<string, string>[],
    validRows: ValidatedRow[],
    errorRows: ErrorRow[],
    skippedDuplicates: SkippedRow[],
    unmatchedManagers: UnmatchedManager[],
  ): Promise<void> {
    const parseResult = CsvRowSchema.safeParse(rawRow);

    if (!parseResult.success) {
      errorRows.push({
        rowNumber,
        data: rawRow,
        errors: parseResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      });
      return;
    }

    const row = parseResult.data;
    const email = row.email.toLowerCase();

    if (seenEmails.has(email)) {
      skippedDuplicates.push({
        rowNumber,
        email: row.email,
        reason: "Duplicate email within file",
      });
      return;
    }
    seenEmails.add(email);

    const existingEmployee = await EmployeeRepository.findByEmail(row.email, organisationId);
    if (existingEmployee) {
      skippedDuplicates.push({
        rowNumber,
        email: row.email,
        reason: "Employee with this email already exists in organisation",
      });
      return;
    }

    if (row.manager_email && row.manager_email.trim()) {
      const managerEmployee = await EmployeeRepository.findByEmail(row.manager_email, organisationId);
      if (!managerEmployee) {
        const managerInRows = allRows.some(
          (r) => r.email && r.email.toLowerCase() === row.manager_email.toLowerCase(),
        );
        if (!managerInRows) {
          unmatchedManagers.push({
            rowNumber,
            employeeEmail: row.email,
            managerEmail: row.manager_email,
          });
        }
      }
    }

    validRows.push({
      rowNumber,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      jobTitle: row.job_title || "",
      department: row.department || "",
      managerEmail: row.manager_email || "",
    });
  }

  /**
   * Parse CSV content and validate all rows.
   * Checks for required columns, validates each row, detects duplicates,
   * and flags unmatched manager references.
   */
  static async parseAndValidate(
    csvContent: string,
    organisationId: string,
  ): Promise<CsvValidationResult> {
    const parsed = Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim().toLowerCase().replace(/\s+/g, "_"),
    });

    const headers = parsed.meta.fields || [];
    const missingColumns = REQUIRED_CSV_COLUMNS.filter((col) => !headers.includes(col));

    if (missingColumns.length > 0) {
      return {
        validRows: [],
        errorRows: [
          {
            rowNumber: 0,
            data: {},
            errors: [`Missing required columns: ${missingColumns.join(", ")}`],
          },
        ],
        skippedDuplicates: [],
        unmatchedManagers: [],
        totalRows: parsed.data.length,
      };
    }

    const validRows: ValidatedRow[] = [];
    const errorRows: ErrorRow[] = [];
    const skippedDuplicates: SkippedRow[] = [];
    const unmatchedManagers: UnmatchedManager[] = [];
    const seenEmails = new Set<string>();

    for (let i = 0; i < parsed.data.length; i++) {
      const rowNumber = i + 2; // +2 because: 1-indexed + header row
      await this.validateRow(
        parsed.data[i],
        rowNumber,
        organisationId,
        seenEmails,
        parsed.data,
        validRows,
        errorRows,
        skippedDuplicates,
        unmatchedManagers,
      );
    }

    return { validRows, errorRows, skippedDuplicates, unmatchedManagers, totalRows: parsed.data.length };
  }

  /**
   * Validate pre-parsed rows (already column-mapped with app field keys).
   * Used by the JSON import path -- skips PapaParse, goes straight to row validation.
   */
  static async parseAndValidateRows(
    rows: Record<string, string>[],
    organisationId: string,
  ): Promise<CsvValidationResult> {
    // Check that required columns exist in at least the first row
    if (rows.length > 0) {
      const firstRowKeys = Object.keys(rows[0]);
      const missingColumns = REQUIRED_CSV_COLUMNS.filter((col) => !firstRowKeys.includes(col));

      if (missingColumns.length > 0) {
        return {
          validRows: [],
          errorRows: [
            {
              rowNumber: 0,
              data: {},
              errors: [`Missing required columns after mapping: ${missingColumns.join(", ")}`],
            },
          ],
          skippedDuplicates: [],
          unmatchedManagers: [],
          totalRows: rows.length,
        };
      }
    }

    const validRows: ValidatedRow[] = [];
    const errorRows: ErrorRow[] = [];
    const skippedDuplicates: SkippedRow[] = [];
    const unmatchedManagers: UnmatchedManager[] = [];
    const seenEmails = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2; // +2 for consistency with CSV (1-indexed + header)
      await this.validateRow(
        rows[i],
        rowNumber,
        organisationId,
        seenEmails,
        rows,
        validRows,
        errorRows,
        skippedDuplicates,
        unmatchedManagers,
      );
    }

    return { validRows, errorRows, skippedDuplicates, unmatchedManagers, totalRows: rows.length };
  }

  /**
   * Import validated rows into the database.
   * Creates user records, employee records, assigns EMPLOYEE role,
   * handles department auto-creation and manager linking.
   */
  static async importValidRows(
    validRows: ValidatedRow[],
    organisationId: string,
    actorId?: string,
  ): Promise<ImportResult> {
    const created: ImportResultEmployee[] = [];
    const errors: ErrorRow[] = [];
    const unmatchedManagers: UnmatchedManager[] = [];

    // First pass: create all employees (without manager links)
    const employeeMap = new Map<string, string>(); // email -> employeeId

    for (const row of validRows) {
      try {
        // Handle department
        let departmentId: string | undefined;
        if (row.department && row.department.trim()) {
          const dept = await DepartmentRepository.findOrCreate(
            organisationId,
            row.department.trim(),
          );
          departmentId = dept.id;
        }

        // Find or create user
        let user = await UserRepository.findByEmail(row.email);
        if (!user) {
          user = await UserRepository.create({
            email: row.email,
            firstName: row.firstName,
            lastName: row.lastName,
          });
        } else {
          // Update name if not set
          if (!user.firstName || !user.lastName) {
            user = await UserRepository.update(user.id, {
              firstName: row.firstName || user.firstName || undefined,
              lastName: row.lastName || user.lastName || undefined,
            });
          }
        }

        // Create employee record
        const employee = await EmployeeRepository.create({
          organisationId,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          jobTitle: row.jobTitle || undefined,
          departmentId,
        });

        // Link user to employee
        await EmployeeRepository.linkUser(employee.id, user.id);

        // Assign EMPLOYEE role
        await UserRoleRepository.create({
          userId: user.id,
          organisationId,
          role: UserRole.EMPLOYEE,
        });

        employeeMap.set(row.email.toLowerCase(), employee.id);
        created.push({
          id: employee.id,
          email: row.email,
          firstName: row.firstName,
          lastName: row.lastName,
        });
      } catch (error: any) {
        errors.push({
          rowNumber: row.rowNumber,
          data: {
            first_name: row.firstName,
            last_name: row.lastName,
            email: row.email,
          },
          errors: [error.message || "Failed to create employee"],
        });
      }
    }

    // Second pass: link managers
    for (const row of validRows) {
      if (!row.managerEmail || !row.managerEmail.trim()) continue;

      const employeeId = employeeMap.get(row.email.toLowerCase());
      if (!employeeId) continue; // Skip if employee creation failed

      // Look up manager by email
      const managerEmployee = await EmployeeRepository.findByEmail(
        row.managerEmail,
        organisationId,
      );

      if (managerEmployee) {
        await EmployeeRepository.update(employeeId, {
          managerId: managerEmployee.id,
        });
      } else {
        unmatchedManagers.push({
          rowNumber: row.rowNumber,
          employeeEmail: row.email,
          managerEmail: row.managerEmail,
        });
      }
    }

    // Audit log the import
    if (actorId) {
      await AuditLogService.log({
        userId: actorId,
        organisationId,
        action: AuditAction.CREATE,
        entity: AuditEntity.EMPLOYEE,
        metadata: {
          event: "csv_import",
          totalRows: validRows.length,
          created: created.length,
          errors: errors.length,
          unmatchedManagers: unmatchedManagers.length,
        },
      });
    }

    return {
      created,
      skippedDuplicates: [], // Already handled during validation
      errors,
      unmatchedManagers,
      totalRows: validRows.length,
    };
  }
}
