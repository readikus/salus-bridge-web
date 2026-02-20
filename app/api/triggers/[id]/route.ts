import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { TriggerConfigRepository } from "@/providers/repositories/trigger-config.repository";
import { TriggerService } from "@/providers/services/trigger.service";
import { TenantService } from "@/providers/services/tenant.service";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { updateTriggerConfigSchema } from "@/schemas/trigger-config";
import { PERMISSIONS } from "@/constants/permissions";
import { AuditAction, AuditEntity } from "@/types/enums";

/**
 * PUT /api/triggers/[id]
 * Update a trigger config.
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

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_TRIGGERS, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = updateTriggerConfigSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const data = parseResult.data;

    const config = await TenantService.withTenant(organisationId, false, async (client) => {
      const existing = await TriggerConfigRepository.findById(id, client);
      if (!existing || existing.organisationId !== organisationId) {
        return null;
      }

      return TriggerConfigRepository.update(
        id,
        {
          name: data.name,
          triggerType: data.triggerType,
          thresholdValue: data.thresholdValue,
          periodDays: data.periodDays,
          isActive: data.isActive,
        },
        client,
      );
    });

    if (!config) {
      return NextResponse.json({ error: "Trigger config not found" }, { status: 404 });
    }

    await AuditLogService.log({
      userId: sessionUser.id,
      organisationId,
      action: AuditAction.UPDATE,
      entity: AuditEntity.TRIGGER_CONFIG,
      entityId: id,
      metadata: data,
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error("Error in PUT /api/triggers/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/triggers/[id]
 * Delete a trigger config.
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

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_TRIGGERS, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await TenantService.withTenant(organisationId, false, async (client) => {
      const existing = await TriggerConfigRepository.findById(id, client);
      if (!existing || existing.organisationId !== organisationId) {
        throw new Error("NOT_FOUND");
      }
      await TriggerConfigRepository.delete(id, client);
    });

    await AuditLogService.log({
      userId: sessionUser.id,
      organisationId,
      action: AuditAction.DELETE,
      entity: AuditEntity.TRIGGER_CONFIG,
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Trigger config not found" }, { status: 404 });
    }
    console.error("Error in DELETE /api/triggers/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/triggers/[id]
 * Acknowledge a trigger alert (id is the alert ID in this context).
 */
export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.VIEW_TRIGGERS, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const alert = await TenantService.withTenant(organisationId, false, async (client) => {
      return TriggerService.acknowledgeAlert(id, sessionUser.id, organisationId, client);
    });

    return NextResponse.json({ alert });
  } catch (error) {
    console.error("Error in PATCH /api/triggers/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
