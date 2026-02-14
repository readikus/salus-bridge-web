import { NextRequest, NextResponse } from "next/server";
import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { AuthService } from "@/providers/services/auth.service";
import { OrganisationService } from "@/providers/services/organisation.service";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { UpdateOrganisationSchema } from "@/schemas/organisation";
import { PERMISSIONS } from "@/constants/permissions";
import { AuditAction, AuditEntity } from "@/types/enums";

const auth0 = new Auth0Client();

/**
 * GET /api/organisations/[slug]
 * Get an organisation by slug (platform admin or org member).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const sessionUser = await AuthService.getSessionUser(session.user.sub);
    if (!sessionUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const organisation = await OrganisationService.getBySlug(slug);
    if (!organisation) {
      return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
    }

    // Check permission: platform admin or member of this org
    const isPlatformAdmin = AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_ORGANISATIONS);
    const isOrgMember = sessionUser.roles.some((r) => r.organisationId === organisation.id);

    if (!isPlatformAdmin && !isOrgMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await AuditLogService.log({
      userId: sessionUser.id,
      organisationId: organisation.id,
      action: AuditAction.VIEW,
      entity: AuditEntity.ORGANISATION,
      entityId: organisation.id,
    });

    return NextResponse.json({ organisation });
  } catch (error) {
    console.error("Error in GET /api/organisations/[slug]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/organisations/[slug]
 * Update an organisation (platform admin or org admin).
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const sessionUser = await AuthService.getSessionUser(session.user.sub);
    if (!sessionUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const organisation = await OrganisationService.getBySlug(slug);
    if (!organisation) {
      return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
    }

    // Check permission: platform admin or org admin for this org
    const isPlatformAdmin = AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_ORGANISATIONS);
    const isOrgAdmin = AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_SETTINGS, organisation.id);

    if (!isPlatformAdmin && !isOrgAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = UpdateOrganisationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updated = await OrganisationService.update(organisation.id, parsed.data, sessionUser.id);
    return NextResponse.json({ organisation: updated });
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Error in PATCH /api/organisations/[slug]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
