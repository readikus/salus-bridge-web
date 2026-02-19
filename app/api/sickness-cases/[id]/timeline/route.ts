import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { SicknessCaseRepository } from "@/providers/repositories/sickness-case.repository";
import { MilestoneService } from "@/providers/services/milestone.service";
import { TenantService } from "@/providers/services/tenant.service";
import { PERMISSIONS } from "@/constants/permissions";

/**
 * GET /api/sickness-cases/[id]/timeline
 * Get the milestone timeline for a specific sickness case.
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

    // Load the case to get the organisationId for tenant context
    const sicknessCase = await SicknessCaseRepository.findById(id);
    if (!sicknessCase) {
      return NextResponse.json({ error: "Sickness case not found" }, { status: 404 });
    }

    const timeline = await TenantService.withTenant(sicknessCase.organisationId, false, async (client) => {
      return MilestoneService.getCaseTimeline(id, sicknessCase.organisationId, client);
    });

    return NextResponse.json({ timeline });
  } catch (error) {
    console.error("Error in GET /api/sickness-cases/[id]/timeline:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
