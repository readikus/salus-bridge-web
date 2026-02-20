import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { MilestoneActionRepository } from "@/providers/repositories/milestone-action.repository";
import { PERMISSIONS } from "@/constants/permissions";

/**
 * PATCH /api/milestone-actions/[actionId]
 * Update status, notes, or completedAt of a milestone action.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ actionId: string }> }) {
  try {
    const { actionId } = await params;
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_SICKNESS_CASES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await MilestoneActionRepository.findById(actionId);
    if (!existing) {
      return NextResponse.json({ error: "Milestone action not found" }, { status: 404 });
    }

    const body = await request.json();
    const { status, notes, completedAt } = body;

    if (!status || !["PENDING", "IN_PROGRESS", "COMPLETED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status. Must be PENDING, IN_PROGRESS or COMPLETED." }, { status: 400 });
    }

    if (completedAt && !/^\d{4}-\d{2}-\d{2}$/.test(completedAt)) {
      return NextResponse.json({ error: "Invalid completedAt format. Use YYYY-MM-DD." }, { status: 400 });
    }

    // Reset to PENDING clears completion fields
    const updated =
      status === "PENDING"
        ? await MilestoneActionRepository.resetToPending(actionId)
        : await MilestoneActionRepository.updateStatus(actionId, status, sessionUser.id, notes, completedAt);

    return NextResponse.json({ action: updated });
  } catch (error) {
    console.error("Error in PATCH /api/milestone-actions/[actionId]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
