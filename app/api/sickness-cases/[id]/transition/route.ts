import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { WorkflowService } from "@/providers/services/workflow.service";
import { SicknessCaseService } from "@/providers/services/sickness-case.service";
import { EmployeeRepository } from "@/providers/repositories/employee.repository";
import { PERMISSIONS } from "@/constants/permissions";
import { SicknessAction } from "@/constants/sickness-states";
import { UserRole } from "@/types/enums";

const VALID_ACTIONS = Object.values(SicknessAction);

/**
 * POST /api/sickness-cases/[id]/transition
 * Execute a state transition on a sickness case.
 * Requires MANAGE_SICKNESS_CASES or REPORT_SICKNESS (for ACKNOWLEDGE by employee).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const body = await request.json();

    const { action, notes } = body;

    // Validate action is a known SicknessAction
    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${VALID_ACTIONS.join(", ")}` },
        { status: 400 },
      );
    }

    // Permission check: ACKNOWLEDGE can be done by employees (REPORT_SICKNESS permission)
    // Other actions require MANAGE_SICKNESS_CASES
    const isAcknowledge = action === SicknessAction.ACKNOWLEDGE;
    const hasManagePermission = AuthService.validateAccess(
      sessionUser,
      PERMISSIONS.MANAGE_SICKNESS_CASES,
      organisationId,
    );
    const hasReportPermission = AuthService.validateAccess(
      sessionUser,
      PERMISSIONS.REPORT_SICKNESS,
      organisationId,
    );

    if (!hasManagePermission && !(isAcknowledge && hasReportPermission)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // For non-admin users, verify access to this specific case
    const isAdminOrHR = sessionUser.isSuperAdmin || sessionUser.roles.some(
      (r) =>
        r.organisationId === organisationId &&
        (r.role === UserRole.ORG_ADMIN || r.role === UserRole.HR),
    );

    if (!isAdminOrHR) {
      const sicknessCase = await SicknessCaseService.getById(id, organisationId);
      if (!sicknessCase) {
        return NextResponse.json({ error: "Sickness case not found" }, { status: 404 });
      }

      const currentEmployee = await EmployeeRepository.findByUserId(sessionUser.id);
      if (!currentEmployee) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const isOwnCase = sicknessCase.employeeId === currentEmployee.id;
      if (!isOwnCase) {
        const team = await EmployeeRepository.getReportingChain(currentEmployee.id);
        const isTeamMember = team.some((e) => e.id === sicknessCase.employeeId);
        if (!isTeamMember) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    }

    const updatedCase = await WorkflowService.transition(
      id,
      action as SicknessAction,
      sessionUser.id,
      organisationId,
      notes,
    );

    return NextResponse.json({ sicknessCase: updatedCase });
  } catch (error: any) {
    if (error.message?.includes("Invalid transition")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error.message === "Sickness case not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Error in POST /api/sickness-cases/[id]/transition:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
