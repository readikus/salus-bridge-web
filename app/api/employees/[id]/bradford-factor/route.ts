import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { EmployeeRepository } from "@/providers/repositories/employee.repository";
import { BradfordFactorService } from "@/providers/services/bradford-factor.service";
import { PERMISSIONS } from "@/constants/permissions";
import { UserRole } from "@/types/enums";

/**
 * GET /api/employees/[id]/bradford-factor
 * Returns Bradford Factor for a single employee.
 * Manager can view for direct reports, HR/admin for any in org.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const employee = await EmployeeRepository.findById(id);
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const organisationId = employee.organisationId;

    // Check permission
    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.VIEW_TRIGGERS, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Manager: can only view for direct reports
    const isAdminOrHR =
      sessionUser.isSuperAdmin ||
      sessionUser.roles.some(
        (r) =>
          r.organisationId === organisationId &&
          (r.role === UserRole.ORG_ADMIN || r.role === UserRole.HR),
      );

    if (!isAdminOrHR) {
      const isManager = sessionUser.roles.some(
        (r) => r.organisationId === organisationId && r.role === UserRole.MANAGER,
      );

      if (isManager) {
        const managerEmployee = await EmployeeRepository.findByUserId(sessionUser.id);
        if (managerEmployee) {
          const team = await EmployeeRepository.getReportingChain(managerEmployee.id);
          const teamIds = team.map((e) => e.id);
          if (!teamIds.includes(id)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
          }
        } else {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const result = await BradfordFactorService.calculate(id);

    return NextResponse.json({ bradfordFactor: result });
  } catch (error) {
    console.error("Error in GET /api/employees/[id]/bradford-factor:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
