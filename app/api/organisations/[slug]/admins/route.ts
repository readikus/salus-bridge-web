import { NextRequest, NextResponse } from "next/server";
import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { AuthService } from "@/providers/services/auth.service";
import { OrganisationService } from "@/providers/services/organisation.service";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { AssignAdminSchema } from "@/schemas/organisation";
import { PERMISSIONS } from "@/constants/permissions";
import { AuditAction, AuditEntity } from "@/types/enums";

const auth0 = new Auth0Client();

/**
 * GET /api/organisations/[slug]/admins
 * List organisation admins.
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

    // Platform admin or org admin can view admins
    const isPlatformAdmin = AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_ORGANISATIONS);
    const isOrgAdmin = AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_SETTINGS, organisation.id);

    if (!isPlatformAdmin && !isOrgAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admins = await OrganisationService.getAdmins(organisation.id);
    return NextResponse.json({ admins });
  } catch (error) {
    console.error("Error in GET /api/organisations/[slug]/admins:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/organisations/[slug]/admins
 * Assign an admin by email (platform admin only - PLAT-02).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
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

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_ORGANISATIONS)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const organisation = await OrganisationService.getBySlug(slug);
    if (!organisation) {
      return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = AssignAdminSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    await OrganisationService.assignAdmin(organisation.id, parsed.data.email, sessionUser.id);

    return NextResponse.json({ message: "Admin assigned successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/organisations/[slug]/admins:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/organisations/[slug]/admins
 * Remove an admin (platform admin only).
 * Body: { userId: string }
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
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

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_ORGANISATIONS)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const organisation = await OrganisationService.getBySlug(slug);
    if (!organisation) {
      return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
    }

    const body = await request.json();
    if (!body.userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await OrganisationService.removeAdmin(organisation.id, body.userId, sessionUser.id);

    return NextResponse.json({ message: "Admin removed successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/organisations/[slug]/admins:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
