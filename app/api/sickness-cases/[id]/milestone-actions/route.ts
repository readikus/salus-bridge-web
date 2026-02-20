import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { SicknessCaseRepository } from "@/providers/repositories/sickness-case.repository";
import { MilestoneActionRepository } from "@/providers/repositories/milestone-action.repository";
import { MilestoneService } from "@/providers/services/milestone.service";
import { TenantService } from "@/providers/services/tenant.service";
import { PERMISSIONS } from "@/constants/permissions";

/**
 * GET /api/sickness-cases/[id]/milestone-actions
 * Return milestone actions for a case. Auto-creates PENDING actions if none exist.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.VIEW_SICKNESS_CASES)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sicknessCase = await SicknessCaseRepository.findById(id);
    if (!sicknessCase) {
      return NextResponse.json({ error: "Sickness case not found" }, { status: 404 });
    }

    const actions = await TenantService.withTenant(sicknessCase.organisationId, false, async (client) => {
      let existing = await MilestoneActionRepository.findBySicknessCase(id, client);

      if (existing.length === 0) {
        // Auto-create PENDING actions from the timeline milestones
        const timeline = await MilestoneService.getCaseTimeline(id, sicknessCase.organisationId, client);
        const actionsToCreate = timeline.map((entry) => ({
          organisationId: sicknessCase.organisationId,
          sicknessCaseId: id,
          milestoneKey: entry.milestone.milestoneKey,
          actionType: "MILESTONE",
          status: "PENDING",
          dueDate: entry.dueDate,
        }));

        existing = await MilestoneActionRepository.createMany(actionsToCreate, client);
      }

      return existing;
    });

    return NextResponse.json({ actions });
  } catch (error) {
    console.error("Error in GET /api/sickness-cases/[id]/milestone-actions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
