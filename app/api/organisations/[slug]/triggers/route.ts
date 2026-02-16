import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { OrganisationService } from "@/providers/services/organisation.service";
import { TriggerConfigRepository } from "@/providers/repositories/trigger-config.repository";
import { TriggerService } from "@/providers/services/trigger.service";
import { TenantService } from "@/providers/services/tenant.service";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { createTriggerConfigSchema } from "@/schemas/trigger-config";
import { PERMISSIONS } from "@/constants/permissions";
import { AuditAction, AuditEntity } from "@/types/enums";

/**
 * GET /api/organisations/[slug]/triggers
 * List trigger configs and alerts for an organisation.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const organisation = await OrganisationService.getBySlug(slug);
    if (!organisation) {
      return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
    }

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.VIEW_TRIGGERS, organisation.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const view = searchParams.get("view"); // "configs" or "alerts"

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

      const alerts = await TenantService.withTenant(organisation.id, false, async (client) => {
        return TriggerService.getAlerts(organisation.id, filters, client);
      });

      return NextResponse.json({ alerts });
    }

    // Default: return configs
    const configs = await TenantService.withTenant(organisation.id, false, async (client) => {
      return TriggerConfigRepository.findByOrganisation(organisation.id, client);
    });

    return NextResponse.json({ configs });
  } catch (error) {
    console.error("Error in GET /api/organisations/[slug]/triggers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/organisations/[slug]/triggers
 * Create a new trigger config.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const organisation = await OrganisationService.getBySlug(slug);
    if (!organisation) {
      return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
    }

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_TRIGGERS, organisation.id)) {
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

    const config = await TenantService.withTenant(organisation.id, false, async (client) => {
      return TriggerConfigRepository.create(
        {
          organisationId: organisation.id,
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
      organisationId: organisation.id,
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
    console.error("Error in POST /api/organisations/[slug]/triggers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
