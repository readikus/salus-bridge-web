import { NextRequest, NextResponse } from "next/server";
import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { AuthService } from "@/providers/services/auth.service";
import { InvitationService } from "@/providers/services/invitation.service";
import { EmployeeRepository } from "@/providers/repositories/employee.repository";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { PERMISSIONS } from "@/constants/permissions";
import { AuditAction, AuditEntity } from "@/types/enums";

const auth0 = new Auth0Client();

/**
 * POST /api/employees/[id]/invite
 * Trigger an invitation for a single employee.
 * Generates a magic link URL. Email delivery is deferred.
 * Org admin only.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const sessionUser = await AuthService.getSessionUser(session.user.sub);
    if (!sessionUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const organisationId = sessionUser.currentOrganisationId;
    if (!organisationId) {
      return NextResponse.json({ error: "No organisation context" }, { status: 400 });
    }

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.SEND_INVITATIONS, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Verify employee exists and belongs to this org
    const employee = await EmployeeRepository.findById(id);
    if (!employee || employee.organisationId !== organisationId) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Generate invitation
    const { token, expiresAt } = await InvitationService.createInvitation(id, organisationId);
    const baseUrl = request.nextUrl.origin;
    const invitationUrl = `${baseUrl}/invite/${token}`;

    // Audit log
    await AuditLogService.log({
      userId: sessionUser.id,
      organisationId,
      action: AuditAction.INVITE,
      entity: AuditEntity.EMPLOYEE,
      entityId: id,
      metadata: { expiresAt },
    });

    return NextResponse.json({ invitationUrl, expiresAt });
  } catch (error) {
    console.error("Error in POST /api/employees/[id]/invite:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
