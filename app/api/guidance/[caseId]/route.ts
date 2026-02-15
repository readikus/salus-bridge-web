import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { GuidanceService } from "@/providers/services/guidance.service";
import { PERMISSIONS } from "@/constants/permissions";

/**
 * GET /api/guidance/[caseId]
 * Get the appropriate guidance script for a sickness case.
 * Returns the matched script and engaged steps for the current user.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const organisationId = sessionUser.currentOrganisationId;
    if (!organisationId) {
      return NextResponse.json({ error: "No organisation context" }, { status: 400 });
    }

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.VIEW_GUIDANCE, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { caseId } = await params;
    const result = await GuidanceService.getGuidanceForCase(caseId, organisationId, sessionUser.id);

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === "Sickness case not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Error in GET /api/guidance/[caseId]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/guidance/[caseId]
 * Track engagement with a guidance step.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const organisationId = sessionUser.currentOrganisationId;
    if (!organisationId) {
      return NextResponse.json({ error: "No organisation context" }, { status: 400 });
    }

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.VIEW_GUIDANCE, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { caseId } = await params;
    const body = await request.json();

    const { guidanceType, guidanceStep } = body;
    if (!guidanceType || !guidanceStep) {
      return NextResponse.json({ error: "guidanceType and guidanceStep are required" }, { status: 400 });
    }

    await GuidanceService.trackEngagement(caseId, sessionUser.id, organisationId, guidanceType, guidanceStep);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in POST /api/guidance/[caseId]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
