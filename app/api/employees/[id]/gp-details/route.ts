import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { EmployeeRepository } from "@/providers/repositories/employee.repository";
import { GpService } from "@/providers/services/gp.service";
import { TenantService } from "@/providers/services/tenant.service";
import { PERMISSIONS } from "@/constants/permissions";
import { gpDetailsSchema } from "@/schemas/gp-details";

/**
 * GET /api/employees/[id]/gp-details
 * Get GP details for an employee. Own data or VIEW_GP_DETAILS permission.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const organisationId = sessionUser.currentOrganisationId;
    if (!organisationId) {
      return NextResponse.json({ error: "No organisation context" }, { status: 400 });
    }

    const { id } = await params;

    // Check ownership or permission
    const employee = await EmployeeRepository.findById(id);
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const isOwner = employee.userId === sessionUser.id;
    if (!isOwner && !AuthService.validateAccess(sessionUser, PERMISSIONS.VIEW_GP_DETAILS, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const isPlatformAdmin = sessionUser.isSuperAdmin;
    const gpDetails = await TenantService.withTenant(organisationId, isPlatformAdmin, async (client) => {
      return EmployeeRepository.getGpDetails(id, client);
    });

    return NextResponse.json({ gpDetails });
  } catch (error) {
    console.error("Error in GET /api/employees/[id]/gp-details:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/employees/[id]/gp-details
 * Update GP details. Own data or MANAGE_GP_DETAILS permission.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const organisationId = sessionUser.currentOrganisationId;
    if (!organisationId) {
      return NextResponse.json({ error: "No organisation context" }, { status: 400 });
    }

    const { id } = await params;

    // Check ownership or permission
    const employee = await EmployeeRepository.findById(id);
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const isOwner = employee.userId === sessionUser.id;
    if (!isOwner && !AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_GP_DETAILS, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = gpDetailsSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const isPlatformAdmin = sessionUser.isSuperAdmin;
    await TenantService.withTenant(organisationId, isPlatformAdmin, async (client) => {
      await GpService.updateGpDetails(id, parseResult.data, sessionUser.id, organisationId, client);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PUT /api/employees/[id]/gp-details:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
