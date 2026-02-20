import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { EmployeeService } from "@/providers/services/employee.service";
import { EmployeeRepository } from "@/providers/repositories/employee.repository";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { AuditAction, AuditEntity } from "@/types/enums";

/**
 * GET /api/me/data
 * Returns all data held about the authenticated user (COMP-05 SAR readiness).
 * Any authenticated user can access their own data.
 */
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Find the employee record for this user
    const employee = await EmployeeRepository.findByUserId(sessionUser.id);
    if (!employee) {
      // User exists but has no employee record -- return basic user info
      return NextResponse.json({
        data: {
          personalInfo: {
            id: sessionUser.id,
            email: sessionUser.email,
            firstName: sessionUser.firstName,
            lastName: sessionUser.lastName,
            jobTitle: null,
            departmentName: null,
            managerName: null,
            status: "N/A",
            createdAt: null,
            updatedAt: null,
          },
          roles: sessionUser.roles.map((r) => ({
            role: r.role,
            organisationName: r.organisationName,
            createdAt: null,
          })),
          activityLog: [],
        },
      });
    }

    // Get full data subject record
    const data = await EmployeeService.getMyData(employee.id);
    if (!data) {
      return NextResponse.json({ error: "Data not found" }, { status: 404 });
    }

    // Audit log this data access
    await AuditLogService.log({
      userId: sessionUser.id,
      organisationId: employee.organisationId,
      action: AuditAction.VIEW,
      entity: AuditEntity.EMPLOYEE,
      entityId: employee.id,
      metadata: { event: "data_subject_access_request" },
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error in GET /api/me/data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
