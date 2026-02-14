import { NextRequest, NextResponse } from "next/server";
import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { AuthService } from "@/providers/services/auth.service";
import { OrganisationService } from "@/providers/services/organisation.service";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { CreateOrganisationSchema } from "@/schemas/organisation";
import { PERMISSIONS } from "@/constants/permissions";
import { AuditAction, AuditEntity } from "@/types/enums";

const auth0 = new Auth0Client();

/**
 * GET /api/organisations
 * List all organisations (platform admin only - PLAT-03).
 */
export async function GET() {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const sessionUser = await AuthService.getSessionUser(session.user.sub);
    if (!sessionUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_ORGANISATIONS)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const organisations = await OrganisationService.list();

    await AuditLogService.log({
      userId: sessionUser.id,
      action: AuditAction.VIEW,
      entity: AuditEntity.ORGANISATION,
      metadata: { action: "list_organisations", count: organisations.length },
    });

    return NextResponse.json({ organisations });
  } catch (error) {
    console.error("Error in GET /api/organisations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/organisations
 * Create a new organisation (platform admin only - PLAT-01).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const sessionUser = await AuthService.getSessionUser(session.user.sub);
    if (!sessionUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_ORGANISATIONS)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = CreateOrganisationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const organisation = await OrganisationService.create(
      { name: parsed.data.name, slug: parsed.data.slug },
      sessionUser.id,
    );
    return NextResponse.json({ organisation }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Error in POST /api/organisations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
