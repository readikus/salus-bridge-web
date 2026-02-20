import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { EmployeeService } from "@/providers/services/employee.service";
import { EmployeeRepository } from "@/providers/repositories/employee.repository";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { PERMISSIONS } from "@/constants/permissions";
import { CreateEmployeeSchema } from "@/schemas/employee";
import { AuditAction, AuditEntity, UserRole } from "@/types/enums";
import { pool } from "@/providers/database/pool";

/**
 * GET /api/employees
 * List employees for the current organisation.
 * Org admin/HR see all; managers see only their reporting chain.
 */
export async function GET(request: NextRequest) {
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

    // Parse optional filters from query params
    const { searchParams } = request.nextUrl;
    const filters = {
      status: searchParams.get("status") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
    };

    // Check if user is a manager (not admin/HR) -- server-side scope filtering (COMP-04)
    const isOrgAdmin = sessionUser.roles.some(
      (r) => r.organisationId === organisationId && (r.role === UserRole.ORG_ADMIN || r.role === UserRole.HR),
    );

    if (!isOrgAdmin && !sessionUser.isSuperAdmin) {
      // Manager: find their employee record and show only their reporting chain
      const managerEmployee = await EmployeeRepository.findByUserId(sessionUser.id);
      if (managerEmployee) {
        const employees = await EmployeeService.listForManager(managerEmployee.id, organisationId);
        return NextResponse.json({ employees });
      }
      return NextResponse.json({ employees: [] });
    }

    const employees = await EmployeeService.list(organisationId, filters);

    // Audit log
    await AuditLogService.log({
      userId: sessionUser.id,
      organisationId,
      action: AuditAction.VIEW,
      entity: AuditEntity.EMPLOYEE,
      metadata: { filters, count: employees.length },
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error("Error in GET /api/employees:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/employees
 * Create a new employee. Org admin only.
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const parseResult = CreateEmployeeSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const { departmentName, managerId, ...rest } = parseResult.data;

    // Resolve department: find existing or create new
    let departmentId: string | undefined;
    if (departmentName && departmentName.trim()) {
      const deptResult = await pool.query(
        `SELECT id FROM departments WHERE LOWER(name) = LOWER($1) AND organisation_id = $2`,
        [departmentName.trim(), organisationId],
      );
      if (deptResult.rows.length > 0) {
        departmentId = deptResult.rows[0].id;
      } else {
        const newDept = await pool.query(
          `INSERT INTO departments (organisation_id, name) VALUES ($1, $2) RETURNING id`,
          [organisationId, departmentName.trim()],
        );
        departmentId = newDept.rows[0].id;
      }
    }

    const employee = await EmployeeService.create(
      {
        firstName: rest.firstName,
        lastName: rest.lastName,
        email: rest.email,
        jobTitle: rest.jobTitle || undefined,
        organisationId,
        departmentId,
        managerId: managerId || undefined,
      },
      organisationId,
      sessionUser.id,
    );

    return NextResponse.json({ employee }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Error in POST /api/employees:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
