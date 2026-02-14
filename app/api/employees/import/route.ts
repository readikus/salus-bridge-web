import { NextRequest, NextResponse } from "next/server";
import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { AuthService } from "@/providers/services/auth.service";
import { CsvImportService } from "@/providers/services/csv-import.service";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { PERMISSIONS } from "@/constants/permissions";
import { AuditAction, AuditEntity } from "@/types/enums";

const auth0 = new Auth0Client();

/**
 * POST /api/employees/import
 * Import employees from a CSV file. Org admin only (ORG-01).
 *
 * Accepts multipart form data with a CSV file.
 * Pipeline: parse CSV -> validate -> detect duplicates -> import valid rows -> return ImportResult.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const sessionUser = await AuthService.getSessionUser(session.user.sub);
    if (!sessionUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const organisationId = sessionUser.currentOrganisationId;
    if (!organisationId) {
      return NextResponse.json({ error: "No organisation context" }, { status: 400 });
    }

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.IMPORT_EMPLOYEES, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file
    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json({ error: "File must be a .csv file" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
    }

    // Read file content
    const csvContent = await file.text();

    if (!csvContent.trim()) {
      return NextResponse.json({ error: "CSV file is empty" }, { status: 400 });
    }

    // Step 1: Parse and validate
    const validationResult = await CsvImportService.parseAndValidate(csvContent, organisationId);

    // If no valid rows, return validation result without importing
    if (validationResult.validRows.length === 0) {
      return NextResponse.json({
        result: {
          created: [],
          skippedDuplicates: validationResult.skippedDuplicates,
          errors: validationResult.errorRows,
          unmatchedManagers: validationResult.unmatchedManagers,
          totalRows: validationResult.totalRows,
        },
      });
    }

    // Step 2: Import valid rows
    const importResult = await CsvImportService.importValidRows(
      validationResult.validRows,
      organisationId,
      sessionUser.id,
    );

    // Combine validation-stage duplicates with import-stage results
    const combinedResult = {
      ...importResult,
      skippedDuplicates: validationResult.skippedDuplicates,
      errors: [...validationResult.errorRows, ...importResult.errors],
      unmatchedManagers: [
        ...validationResult.unmatchedManagers,
        ...importResult.unmatchedManagers,
      ],
      totalRows: validationResult.totalRows,
    };

    // Audit log the import action
    await AuditLogService.log({
      userId: sessionUser.id,
      organisationId,
      action: AuditAction.CREATE,
      entity: AuditEntity.EMPLOYEE,
      metadata: {
        event: "csv_import_completed",
        fileName: file.name,
        totalRows: combinedResult.totalRows,
        created: combinedResult.created.length,
        skippedDuplicates: combinedResult.skippedDuplicates.length,
        errors: combinedResult.errors.length,
        unmatchedManagers: combinedResult.unmatchedManagers.length,
      },
    });

    return NextResponse.json({ result: combinedResult });
  } catch (error) {
    console.error("Error in POST /api/employees/import:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
