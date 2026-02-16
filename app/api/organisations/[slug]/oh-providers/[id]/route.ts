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
 * PUT /api/organisations/[slug]/oh-providers/[id]
 * Update an OH provider.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const { slug, id } = await params;
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
    const parsed = ohProviderSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const provider = await TenantService.withTenant(organisation.id, false, async (client) => {
      const existing = await OhProviderRepository.findById(id, client);
      if (!existing || existing.organisationId !== organisation.id) {
        return null;
      }

      return OhProviderRepository.update(
        id,
        {
          name: parsed.data.name,
          contactEmail: parsed.data.contactEmail,
          contactPhone: parsed.data.contactPhone,
          address: parsed.data.address,
          notes: parsed.data.notes,
        },
        client,
      );
    });

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    await AuditLogService.log({
      userId: sessionUser.id,
      organisationId: organisation.id,
      action: AuditAction.UPDATE,
      entity: AuditEntity.OH_PROVIDER,
      entityId: id,
    });

    return NextResponse.json({ provider });
  } catch (error) {
    console.error("Error in PUT /api/organisations/[slug]/oh-providers/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/organisations/[slug]/oh-providers/[id]
 * Delete an OH provider.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const { slug, id } = await params;
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

    await TenantService.withTenant(organisation.id, false, async (client) => {
      const existing = await OhProviderRepository.findById(id, client);
      if (!existing || existing.organisationId !== organisation.id) {
        throw new Error("Provider not found");
      }

      await OhProviderRepository.delete(id, client);
    });

    await AuditLogService.log({
      userId: sessionUser.id,
      organisationId: organisation.id,
      action: AuditAction.DELETE,
      entity: AuditEntity.OH_PROVIDER,
      entityId: id,
    });

    return NextResponse.json({ message: "Provider deleted" });
  } catch (error: any) {
    if (error.message === "Provider not found") {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }
    console.error("Error in DELETE /api/organisations/[slug]/oh-providers/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
