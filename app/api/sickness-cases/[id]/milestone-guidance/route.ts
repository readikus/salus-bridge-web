import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { SicknessCaseRepository } from "@/providers/repositories/sickness-case.repository";
import { MilestoneService } from "@/providers/services/milestone.service";
import { TenantService } from "@/providers/services/tenant.service";
import { PERMISSIONS } from "@/constants/permissions";

/**
 * GET /api/sickness-cases/[id]/milestone-guidance
 * Return milestone guidance map for a case, keyed by milestoneKey.
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

    const guidanceMap = await TenantService.withTenant(sicknessCase.organisationId, false, async (client) => {
      // Get the timeline to know which milestone keys are relevant
      const timeline = await MilestoneService.getCaseTimeline(id, sicknessCase.organisationId, client);
      const milestoneKeys = timeline.map((entry) => entry.milestone.milestoneKey);

      return MilestoneService.getGuidanceMap(milestoneKeys, sicknessCase.organisationId, client);
    });

    return NextResponse.json({ guidance: guidanceMap });
  } catch (error) {
    console.error("Error in GET /api/sickness-cases/[id]/milestone-guidance:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
