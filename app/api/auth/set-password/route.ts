import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { InvitationService } from "@/providers/services/invitation.service";
import { UserRepository } from "@/providers/repositories/user.repository";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { SetPasswordSchema } from "@/schemas/auth";
import { AuditAction, AuditEntity } from "@/types/enums";

/**
 * POST /api/auth/set-password
 * Accept an invitation by setting a password.
 *
 * Flow: validate token -> create Supabase auth user via admin API -> link to local user -> mark accepted.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
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

    // Get the employee's email via their linked user
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

    // Create Supabase auth user via admin API (service role key)
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceRoleKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY not configured");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Create user in Supabase Auth
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    let supabaseAuthId: string | null = null;

    if (createError) {
      // If user already exists in Supabase Auth, try to find them by email
      if (createError.message?.includes("already been registered")) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        const existingUser = listData?.users?.find((u: { email?: string }) => u.email === email);
        supabaseAuthId = existingUser?.id || null;
      } else {
        console.error("Failed to create Supabase auth user:", createError);
        return NextResponse.json({ error: "Failed to create account. Please try again." }, { status: 500 });
      }
    } else {
      supabaseAuthId = authData.user.id;
    }

    if (supabaseAuthId && employee.userId) {
      // Update local user with Supabase Auth ID
      await UserRepository.update(employee.userId, { supabaseAuthId });
    }

    // Accept the invitation (links employee to user, assigns EMPLOYEE role, clears token)
    if (supabaseAuthId && employee.userId) {
      await InvitationService.acceptInvitation(token, supabaseAuthId, employee.userId);
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
      redirectTo: "/login",
    });
  } catch (error) {
    console.error("Error in POST /api/auth/set-password:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
