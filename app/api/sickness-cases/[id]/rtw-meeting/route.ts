import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { RtwMeetingService } from "@/providers/services/rtw-meeting.service";
import { PERMISSIONS } from "@/constants/permissions";
import { createRtwMeetingSchema } from "@/schemas/rtw-meeting";

/**
 * GET /api/sickness-cases/[id]/rtw-meeting
 * Fetch all RTW meetings for a sickness case.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const organisationId = sessionUser.currentOrganisationId;
    if (!organisationId) {
      return NextResponse.json({ error: "No organisation context" }, { status: 400 });
    }

    const hasPermission =
      AuthService.validateAccess(sessionUser, PERMISSIONS.SCHEDULE_RTW, organisationId) ||
      AuthService.validateAccess(sessionUser, PERMISSIONS.COMPLETE_RTW, organisationId);

    if (!hasPermission) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const meetings = await RtwMeetingService.getForCase(id, organisationId);

    return NextResponse.json({ meetings });
  } catch (error: any) {
    console.error("Error in GET /api/sickness-cases/[id]/rtw-meeting:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/sickness-cases/[id]/rtw-meeting
 * Schedule a new RTW meeting.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const organisationId = sessionUser.currentOrganisationId;
    if (!organisationId) {
      return NextResponse.json({ error: "No organisation context" }, { status: 400 });
    }

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.SCHEDULE_RTW, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const parsed = createRtwMeetingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const meeting = await RtwMeetingService.schedule(id, parsed.data.scheduledDate, sessionUser.id, organisationId);

    return NextResponse.json({ meeting }, { status: 201 });
  } catch (error: any) {
    if (error.message === "Sickness case not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error.message?.includes("Invalid transition")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error in POST /api/sickness-cases/[id]/rtw-meeting:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/sickness-cases/[id]/rtw-meeting
 * Complete or cancel an RTW meeting.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const organisationId = sessionUser.currentOrganisationId;
    if (!organisationId) {
      return NextResponse.json({ error: "No organisation context" }, { status: 400 });
    }

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.COMPLETE_RTW, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const { meetingId, action, questionnaireResponses, outcomes, adjustments } = body;

    if (!meetingId || !action) {
      return NextResponse.json({ error: "meetingId and action are required" }, { status: 400 });
    }

    if (action === "complete") {
      const meeting = await RtwMeetingService.complete(
        meetingId,
        {
          questionnaireResponses: questionnaireResponses || {},
          outcomes: outcomes || "",
          adjustments: adjustments || [],
        },
        sessionUser.id,
        organisationId,
      );

      return NextResponse.json({ meeting });
    }

    if (action === "cancel") {
      const meeting = await RtwMeetingService.cancel(meetingId, sessionUser.id, organisationId);
      return NextResponse.json({ meeting });
    }

    return NextResponse.json({ error: "Invalid action. Must be 'complete' or 'cancel'" }, { status: 400 });
  } catch (error: any) {
    if (error.message === "RTW meeting not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error.message?.includes("not in SCHEDULED status") || error.message?.includes("Invalid transition")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error in PATCH /api/sickness-cases/[id]/rtw-meeting:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
