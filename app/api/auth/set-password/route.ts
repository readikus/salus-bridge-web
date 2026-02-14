import { NextRequest, NextResponse } from "next/server";
import { InvitationService } from "@/providers/services/invitation.service";
import { UserRepository } from "@/providers/repositories/user.repository";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { SetPasswordSchema } from "@/schemas/auth";
import { AuditAction, AuditEntity } from "@/types/enums";

/**
 * POST /api/auth/set-password
 * Accept an invitation by setting a password.
 *
 * Flow: validate token -> create Auth0 user via Management API -> link to local user -> mark accepted.
 * Per user decision: click magic link -> set password page -> straight to dashboard (no profile review).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input (only token and password needed here, confirmPassword checked client-side)
    const parseResult = SetPasswordSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const { token, password } = parseResult.data;

    // Validate the invitation token
    const validation = await InvitationService.validateToken(token);
    if (!validation.valid || !validation.employee) {
      if (validation.expired) {
        return NextResponse.json(
          { error: "Invitation has expired. Please contact your administrator." },
          { status: 410 },
        );
      }
      return NextResponse.json({ error: "Invalid invitation token" }, { status: 400 });
    }

    const employee = validation.employee;

    // Get the employee's email via their linked user (created at employee creation time)
    // If no user linked yet, we need to look up by other means
    let email: string | null = null;
    if (employee.userId) {
      const user = await UserRepository.findById(employee.userId);
      email = user?.email || null;
    }

    if (!email) {
      return NextResponse.json(
        { error: "No email associated with this employee. Contact your administrator." },
        { status: 400 },
      );
    }

    // Create Auth0 user via Management API
    const auth0Domain = process.env.AUTH0_DOMAIN;
    const auth0ManagementClientId = process.env.AUTH0_MANAGEMENT_CLIENT_ID;
    const auth0ManagementClientSecret = process.env.AUTH0_MANAGEMENT_CLIENT_SECRET;

    if (!auth0Domain || !auth0ManagementClientId || !auth0ManagementClientSecret) {
      console.error("Auth0 Management API credentials not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    // Get a Management API token
    const tokenResponse = await fetch(`https://${auth0Domain}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: auth0ManagementClientId,
        client_secret: auth0ManagementClientSecret,
        audience: `https://${auth0Domain}/api/v2/`,
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Failed to get Auth0 Management API token");
      return NextResponse.json(
        { error: "Failed to create account. Please try again." },
        { status: 500 },
      );
    }

    const { access_token: managementToken } = await tokenResponse.json();

    // Create user in Auth0
    const createUserResponse = await fetch(`https://${auth0Domain}/api/v2/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${managementToken}`,
      },
      body: JSON.stringify({
        email,
        password,
        connection: "Username-Password-Authentication",
        email_verified: true,
      }),
    });

    if (!createUserResponse.ok) {
      const errorData = await createUserResponse.json();
      // If user already exists in Auth0, that's okay — just link them
      if (errorData.statusCode !== 409) {
        console.error("Failed to create Auth0 user:", errorData);
        return NextResponse.json(
          { error: "Failed to create account. Please try again." },
          { status: 500 },
        );
      }
    }

    const auth0User = createUserResponse.ok ? await createUserResponse.json() : null;
    const auth0Id = auth0User?.user_id;

    if (auth0Id && employee.userId) {
      // Update local user with Auth0 ID
      await UserRepository.update(employee.userId, { auth0Id });
    }

    // Accept the invitation (links employee to user, assigns EMPLOYEE role, clears token)
    if (auth0Id && employee.userId) {
      await InvitationService.acceptInvitation(token, auth0Id, employee.userId);
    }

    // Audit log
    await AuditLogService.log({
      userId: employee.userId || undefined,
      organisationId: employee.organisationId,
      action: AuditAction.UPDATE,
      entity: AuditEntity.USER,
      metadata: { event: "password_set_via_invitation", employeeId: employee.id },
    });

    return NextResponse.json({
      success: true,
      redirectTo: "/auth/login",
    });
  } catch (error) {
    console.error("Error in POST /api/auth/set-password:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
