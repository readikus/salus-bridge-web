import { NextRequest, NextResponse } from "next/server";
import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { AuthService } from "@/providers/services/auth.service";
import { InvitationService } from "@/providers/services/invitation.service";
import { EmployeeRepository } from "@/providers/repositories/employee.repository";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { PERMISSIONS } from "@/constants/permissions";
import { InviteSchema } from "@/schemas/auth";
import { AuditAction, AuditEntity } from "@/types/enums";

const auth0 = new Auth0Client();

/**
 * POST /api/auth/invite
 * Create invitations for one or more employees (supports bulk per user decision).
 * Generates magic link URLs — email sending is deferred to Phase 2.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get session user and validate permissions
    const sessionUser = await AuthService.getSessionUser(session.user.sub);
    if (!sessionUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (
      !AuthService.validateAccess(
        sessionUser,
        PERMISSIONS.SEND_INVITATIONS,
        sessionUser.currentOrganisationId || undefined,
      )
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = InviteSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const { employeeIds } = parseResult.data;
    const baseUrl = request.nextUrl.origin;
    const results: { employeeId: string; inviteUrl: string; expiresAt: Date }[] = [];
    const errors: { employeeId: string; error: string }[] = [];

    for (const employeeId of employeeIds) {
      try {
        const employee = await EmployeeRepository.findById(employeeId);
        if (!employee) {
          errors.push({ employeeId, error: "Employee not found" });
          continue;
        }

        const { token, expiresAt } = await InvitationService.createInvitation(
          employeeId,
          employee.organisationId,
        );

        results.push({
          employeeId,
          inviteUrl: `${baseUrl}/invite/${token}`,
          expiresAt,
        });
      } catch (err) {
        errors.push({ employeeId, error: "Failed to create invitation" });
      }
    }

    // Audit log the invitation action
    await AuditLogService.log({
      userId: sessionUser.id,
      organisationId: sessionUser.currentOrganisationId || undefined,
      action: AuditAction.INVITE,
      entity: AuditEntity.EMPLOYEE,
      metadata: {
        invited: results.map((r) => r.employeeId),
        failed: errors.map((e) => e.employeeId),
        count: results.length,
      },
    });

    return NextResponse.json({
      invitations: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error in POST /api/auth/invite:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
