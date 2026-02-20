import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { MilestoneService } from "@/providers/services/milestone.service";
import { TenantService } from "@/providers/services/tenant.service";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { createMilestoneConfigSchema } from "@/schemas/milestone-config";
import { PERMISSIONS } from "@/constants/permissions";
import { AuditAction, AuditEntity } from "@/types/enums";

/**
 * GET /api/milestones
 * List effective milestones for the session user's current organisation.
 */
export async function GET(_request: NextRequest) {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const organisationId = sessionUser.currentOrganisationId;
    if (!organisationId) {
      return NextResponse.json({ error: "No organisation context" }, { status: 400 });
    }

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.VIEW_MILESTONES, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const milestones = await TenantService.withTenant(organisationId, false, async (client) => {
      return MilestoneService.getEffectiveMilestonesWithGuidance(organisationId, client);
    });

    return NextResponse.json({ milestones });
  } catch (error) {
    console.error("Error in GET /api/milestones:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/milestones
 * Create or update an org-level milestone override.
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

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_MILESTONES, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = createMilestoneConfigSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const data = parseResult.data;

    const config = await TenantService.withTenant(organisationId, false, async (client) => {
      return MilestoneService.upsertOrgMilestone(organisationId, data, sessionUser.id, client);
    });

    await AuditLogService.log({
      userId: sessionUser.id,
      organisationId,
      action: AuditAction.UPDATE,
      entity: AuditEntity.MILESTONE_CONFIG,
      entityId: config.id,
      metadata: {
        milestoneKey: data.milestoneKey,
        label: data.label,
        dayOffset: data.dayOffset,
      },
    });

    return NextResponse.json({ config }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/milestones:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
