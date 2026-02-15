import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { FitNoteService } from "@/providers/services/fit-note.service";
import { EmployeeRepository } from "@/providers/repositories/employee.repository";
import { PERMISSIONS } from "@/constants/permissions";
import { createFitNoteSchema } from "@/schemas/fit-note";
import { UserRole } from "@/types/enums";

/**
 * GET /api/sickness-cases/[id]/fit-notes
 * List fit notes for a sickness case.
 * FIT-04: Managers receive 403 -- they cannot access fit note documents.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: caseId } = await params;
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const organisationId = sessionUser.currentOrganisationId;
    if (!organisationId) {
      return NextResponse.json({ error: "No organisation context" }, { status: 400 });
    }

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.VIEW_FIT_NOTES, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Determine employee ID for ownership check
    const employee = await EmployeeRepository.findByUserId(sessionUser.id);
    const employeeId = employee?.id;

    const fitNotes = await FitNoteService.getForCase(caseId, sessionUser.id, organisationId, sessionUser.roles, employeeId);

    return NextResponse.json({ fitNotes });
  } catch (error: any) {
    if (error.message?.includes("Managers do not have access")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error.message?.includes("your own")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error in GET /api/sickness-cases/[id]/fit-notes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/sickness-cases/[id]/fit-notes
 * Upload a fit note document with metadata.
 * Accepts multipart form data: file + metadata fields.
 * Requires UPLOAD_FIT_NOTES permission (HR, ORG_ADMIN) OR is the employee who owns the case.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: caseId } = await params;
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const organisationId = sessionUser.currentOrganisationId;
    if (!organisationId) {
      return NextResponse.json({ error: "No organisation context" }, { status: 400 });
    }

    // Check permission: UPLOAD_FIT_NOTES or own case employee
    const hasUploadPermission = AuthService.validateAccess(sessionUser, PERMISSIONS.UPLOAD_FIT_NOTES, organisationId);
    const employee = await EmployeeRepository.findByUserId(sessionUser.id);

    if (!hasUploadPermission) {
      // Must be the employee who owns the case -- checked via FitNoteService
      const isEmployee = sessionUser.roles.some(
        (r) => r.organisationId === organisationId && r.role === UserRole.EMPLOYEE,
      );
      if (!isEmployee || !employee) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Parse metadata fields
    const metadataPayload = {
      fitNoteStatus: formData.get("fitNoteStatus") as string,
      startDate: formData.get("startDate") as string,
      endDate: (formData.get("endDate") as string) || undefined,
      functionalEffects: formData.getAll("functionalEffects") as string[],
      notes: (formData.get("notes") as string) || undefined,
    };

    // Handle functionalEffects sent as JSON string
    if (metadataPayload.functionalEffects.length === 1 && metadataPayload.functionalEffects[0]) {
      try {
        const parsed = JSON.parse(metadataPayload.functionalEffects[0]);
        if (Array.isArray(parsed)) {
          metadataPayload.functionalEffects = parsed;
        }
      } catch {
        // Keep as-is if not JSON
      }
    }

    // Validate metadata with schema
    const parseResult = createFitNoteSchema.safeParse(metadataPayload);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const fitNote = await FitNoteService.upload(
      caseId,
      {
        buffer: fileBuffer,
        name: file.name,
        contentType: file.type,
        size: file.size,
      },
      parseResult.data,
      sessionUser.id,
      organisationId,
    );

    return NextResponse.json({ fitNote }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes("Invalid content type") || error.message?.includes("File size exceeds")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error.message?.includes("Invalid transition")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Error in POST /api/sickness-cases/[id]/fit-notes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
