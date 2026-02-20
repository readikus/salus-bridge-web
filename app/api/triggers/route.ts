import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { TriggerConfigRepository } from "@/providers/repositories/trigger-config.repository";
import { TriggerService } from "@/providers/services/trigger.service";
import { TenantService } from "@/providers/services/tenant.service";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { createTriggerConfigSchema } from "@/schemas/trigger-config";
import { PERMISSIONS } from "@/constants/permissions";
import { AuditAction, AuditEntity } from "@/types/enums";

/**
 * GET /api/triggers
 * List trigger configs and alerts for the session user's current organisation.
 */
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = request.nextUrl;
    const view = searchParams.get("view");

    if (view === "alerts") {
      const filters = {
        employeeId: searchParams.get("employeeId") || undefined,
        acknowledged:
          searchParams.get("acknowledged") === "true"
            ? true
            : searchParams.get("acknowledged") === "false"
              ? false
              : undefined,
        limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined,
        offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!, 10) : undefined,
      };

      const alerts = await TenantService.withTenant(organisationId, false, async (client) => {
        return TriggerService.getAlerts(organisationId, filters, client);
      });

      return NextResponse.json({ alerts });
    }

    // Default: return configs
    const configs = await TenantService.withTenant(organisationId, false, async (client) => {
      return TriggerConfigRepository.findByOrganisation(organisationId, client);
    });

    return NextResponse.json({ configs });
  } catch (error) {
    console.error("Error in GET /api/triggers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/triggers
 * Create a new trigger config for the session user's current organisation.
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

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_TRIGGERS, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = createTriggerConfigSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const data = parseResult.data;

    const config = await TenantService.withTenant(organisationId, false, async (client) => {
      return TriggerConfigRepository.create(
        {
          organisationId,
          name: data.name,
          triggerType: data.triggerType,
          thresholdValue: data.thresholdValue,
          periodDays: data.periodDays,
          isActive: data.isActive,
          createdBy: sessionUser.id,
        },
        client,
      );
    });

    await AuditLogService.log({
      userId: sessionUser.id,
      organisationId,
      action: AuditAction.CREATE,
      entity: AuditEntity.TRIGGER_CONFIG,
      entityId: config.id,
      metadata: {
        name: data.name,
        triggerType: data.triggerType,
        thresholdValue: data.thresholdValue,
        periodDays: data.periodDays,
      },
    });

    return NextResponse.json({ config }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/triggers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
