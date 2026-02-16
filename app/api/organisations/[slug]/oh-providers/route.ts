import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { OrganisationService } from "@/providers/services/organisation.service";
import { OhProviderRepository } from "@/providers/repositories/oh-provider.repository";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { TenantService } from "@/providers/services/tenant.service";
import { ohProviderSchema } from "@/schemas/oh-provider";
import { PERMISSIONS } from "@/constants/permissions";
import { AuditAction, AuditEntity } from "@/types/enums";

/**
 * GET /api/organisations/[slug]/oh-providers
 * List OH providers for an organisation.
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

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.VIEW_OH_PROVIDERS, organisation.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const providers = await TenantService.withTenant(organisation.id, false, async (client) => {
      return OhProviderRepository.findByOrganisation(organisation.id, client);
    });

    return NextResponse.json({ providers });
  } catch (error) {
    console.error("Error in GET /api/organisations/[slug]/oh-providers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/organisations/[slug]/oh-providers
 * Create a new OH provider.
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

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_OH_PROVIDERS, organisation.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = ohProviderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const provider = await TenantService.withTenant(organisation.id, false, async (client) => {
      return OhProviderRepository.create(
        {
          organisationId: organisation.id,
          name: parsed.data.name,
          contactEmail: parsed.data.contactEmail || undefined,
          contactPhone: parsed.data.contactPhone || undefined,
          address: parsed.data.address || undefined,
          notes: parsed.data.notes || undefined,
          createdBy: sessionUser.id,
        },
        client,
      );
    });

    await AuditLogService.log({
      userId: sessionUser.id,
      organisationId: organisation.id,
      action: AuditAction.CREATE,
      entity: AuditEntity.OH_PROVIDER,
      entityId: provider.id,
      metadata: { name: parsed.data.name },
    });

    return NextResponse.json({ provider }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/organisations/[slug]/oh-providers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
