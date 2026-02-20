import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { MilestoneConfigRepository } from "@/providers/repositories/milestone-config.repository";
import { MilestoneService } from "@/providers/services/milestone.service";
import { MilestoneGuidanceInput } from "@/schemas/milestone-config";
import { TenantService } from "@/providers/services/tenant.service";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { updateMilestoneConfigSchema } from "@/schemas/milestone-config";
import { PERMISSIONS } from "@/constants/permissions";
import { AuditAction, AuditEntity } from "@/types/enums";

/**
 * PUT /api/milestones/[id]
 * Update a specific milestone config override.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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
    const parseResult = updateMilestoneConfigSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const data = parseResult.data;

    const { guidance, ...configData } = data;

    const config = await TenantService.withTenant(organisationId, false, async (client) => {
      const updatedConfig = await MilestoneConfigRepository.update(id, configData, client);

      if (guidance) {
        await MilestoneService.upsertOrgGuidance(
          organisationId,
          updatedConfig.milestoneKey,
          guidance as MilestoneGuidanceInput,
          client,
        );
      }

      return updatedConfig;
    });

    await AuditLogService.log({
      userId: sessionUser.id,
      organisationId,
      action: AuditAction.UPDATE,
      entity: AuditEntity.MILESTONE_CONFIG,
      entityId: id,
      metadata: data,
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Error in PUT /api/milestones/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/milestones/[id]
 * Reset an org milestone override back to default (deletes the override row).
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
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

    await TenantService.withTenant(organisationId, false, async (client) => {
      return MilestoneService.resetToDefault(id, organisationId, sessionUser.id, client);
    });

    await AuditLogService.log({
      userId: sessionUser.id,
      organisationId,
      action: AuditAction.DELETE,
      entity: AuditEntity.MILESTONE_CONFIG,
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/milestones/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
