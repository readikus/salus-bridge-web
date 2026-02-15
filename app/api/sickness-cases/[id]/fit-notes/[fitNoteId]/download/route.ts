import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { FitNoteService } from "@/providers/services/fit-note.service";
import { EmployeeRepository } from "@/providers/repositories/employee.repository";
import { PERMISSIONS } from "@/constants/permissions";

/**
 * GET /api/sickness-cases/[id]/fit-notes/[fitNoteId]/download
 * Generate a signed URL for downloading a fit note document.
 * FIT-04: Managers receive 403 -- they cannot access fit note documents.
 * Signed URL expires after 5 minutes (300 seconds).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; fitNoteId: string }> },
) {
  try {
    const { fitNoteId } = await params;
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

    const signedUrl = await FitNoteService.getSignedDownloadUrl(
      fitNoteId,
      sessionUser.id,
      organisationId,
      sessionUser.roles,
      employeeId,
    );

    return NextResponse.json({ signedUrl });
  } catch (error: any) {
    if (error.message?.includes("Managers do not have access")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error.message?.includes("not found")) {
      return NextResponse.json({ error: "Fit note not found" }, { status: 404 });
    }
    if (error.message?.includes("your own")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Error in GET /api/sickness-cases/[id]/fit-notes/[fitNoteId]/download:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
