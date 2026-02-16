import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { CsvImportService } from "@/providers/services/csv-import.service";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { PERMISSIONS } from "@/constants/permissions";
import { AuditAction, AuditEntity } from "@/types/enums";
import { applyColumnMapping } from "@/utils/column-mapping";
import { MappedImportPayload } from "@/schemas/csv-import";
import { AppFieldKey } from "@/utils/column-mapping";

/**
 * POST /api/employees/import
 * Import employees from a CSV file. Org admin only (ORG-01).
 *
 * Accepts multipart form data with a CSV file.
 * Pipeline: parse CSV -> validate -> detect duplicates -> import valid rows -> return ImportResult.
 */
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const organisationId = sessionUser.currentOrganisationId;
    if (!organisationId) {
      return NextResponse.json({ error: "No organisation context" }, { status: 400 });
    }

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.IMPORT_EMPLOYEES, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const contentType = request.headers.get("content-type") || "";

    // JSON path: pre-parsed rows with confirmed column mapping (new wizard)
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as MappedImportPayload;

      if (!body.rows || !Array.isArray(body.rows) || body.rows.length === 0) {
        return NextResponse.json({ error: "No rows provided" }, { status: 400 });
      }

      if (!body.mapping || typeof body.mapping !== "object") {
        return NextResponse.json({ error: "No column mapping provided" }, { status: 400 });
      }

      // Apply column mapping to normalize row keys to app field keys
      const normalizedRows = applyColumnMapping(body.rows, body.mapping as Record<AppFieldKey, string | null>);

      // Validate and import using pre-parsed rows
      const validationResult = await CsvImportService.parseAndValidateRows(normalizedRows, organisationId);

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

      const importResult = await CsvImportService.importValidRows(
        validationResult.validRows,
        organisationId,
        sessionUser.id,
      );

      const combinedResult = {
        ...importResult,
        skippedDuplicates: validationResult.skippedDuplicates,
        errors: [...validationResult.errorRows, ...importResult.errors],
        unmatchedManagers: [...validationResult.unmatchedManagers, ...importResult.unmatchedManagers],
        totalRows: validationResult.totalRows,
      };

      await AuditLogService.log({
        userId: sessionUser.id,
        organisationId,
        action: AuditAction.CREATE,
        entity: AuditEntity.EMPLOYEE,
        metadata: {
          event: "csv_import_completed",
          source: "mapped_json",
          totalRows: combinedResult.totalRows,
          created: combinedResult.created.length,
          skippedDuplicates: combinedResult.skippedDuplicates.length,
          errors: combinedResult.errors.length,
          unmatchedManagers: combinedResult.unmatchedManagers.length,
        },
      });

      return NextResponse.json({ result: combinedResult });
    }

    // FormData path: legacy CSV file upload (backward compat)
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json({ error: "File must be a .csv file" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
    }

    const csvContent = await file.text();

    if (!csvContent.trim()) {
      return NextResponse.json({ error: "CSV file is empty" }, { status: 400 });
    }

    const validationResult = await CsvImportService.parseAndValidate(csvContent, organisationId);

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

    const importResult = await CsvImportService.importValidRows(
      validationResult.validRows,
      organisationId,
      sessionUser.id,
    );

    const combinedResult = {
      ...importResult,
      skippedDuplicates: validationResult.skippedDuplicates,
      errors: [...validationResult.errorRows, ...importResult.errors],
      unmatchedManagers: [...validationResult.unmatchedManagers, ...importResult.unmatchedManagers],
      totalRows: validationResult.totalRows,
    };

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
