import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { EmployeeService } from "@/providers/services/employee.service";
import { PERMISSIONS } from "@/constants/permissions";
import { UpdateEmployeeSchema } from "@/schemas/employee";
import { UserRole } from "@/types/enums";

/**
 * GET /api/employees/[id]
 * Get employee detail. Accessible by org admin, HR, or the employee's manager.
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

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.VIEW_EMPLOYEES, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const employee = await EmployeeService.getById(id, organisationId);
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Get the employee's roles
    const roles = await EmployeeService.getRoles(id, organisationId);

    return NextResponse.json({ employee, roles });
  } catch (error) {
    console.error("Error in GET /api/employees/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/employees/[id]
 * Update an employee. Org admin only.
 * Also handles role assignment via `roles` field in the body.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const organisationId = sessionUser.currentOrganisationId;
    if (!organisationId) {
      return NextResponse.json({ error: "No organisation context" }, { status: 400 });
    }

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_EMPLOYEES, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Handle role updates if provided
    if (body.roles && Array.isArray(body.roles)) {
      const assignableRoles = [UserRole.MANAGER, UserRole.HR, UserRole.EMPLOYEE];
      const currentRoles = await EmployeeService.getRoles(id, organisationId);
      const requestedRoles = body.roles as UserRole[];

      // Add new roles
      for (const role of requestedRoles) {
        if (assignableRoles.includes(role) && !currentRoles.includes(role)) {
          await EmployeeService.assignRole(id, role, organisationId, sessionUser.id);
        }
      }

      // Remove roles no longer requested
      for (const role of currentRoles) {
        if (assignableRoles.includes(role) && !requestedRoles.includes(role)) {
          await EmployeeService.removeRole(id, role, organisationId, sessionUser.id);
        }
      }
    }

    // Handle employee field updates
    const { roles: _, ...employeeFields } = body;
    const parseResult = UpdateEmployeeSchema.safeParse(employeeFields);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const hasFieldUpdates = Object.keys(parseResult.data).length > 0;
    let employee;

    if (hasFieldUpdates) {
      employee = await EmployeeService.update(id, parseResult.data, organisationId, sessionUser.id);
    } else {
      employee = await EmployeeService.getById(id, organisationId);
    }

    const updatedRoles = await EmployeeService.getRoles(id, organisationId);

    return NextResponse.json({ employee, roles: updatedRoles });
  } catch (error: any) {
    if (error.message === "Employee not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Error in PATCH /api/employees/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/employees/[id]
 * Deactivate an employee (soft delete). Org admin only.
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const organisationId = sessionUser.currentOrganisationId;
    if (!organisationId) {
      return NextResponse.json({ error: "No organisation context" }, { status: 400 });
    }

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_EMPLOYEES, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    await EmployeeService.deactivate(id, organisationId, sessionUser.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Employee not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Error in DELETE /api/employees/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
