import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { SicknessCaseService } from "@/providers/services/sickness-case.service";
import { EmployeeRepository } from "@/providers/repositories/employee.repository";
import { WorkflowService } from "@/providers/services/workflow.service";
import { PERMISSIONS } from "@/constants/permissions";
import { SicknessState } from "@/constants/sickness-states";
import { UserRole } from "@/types/enums";

/**
 * GET /api/sickness-cases/[id]
 * Get sickness case detail with transitions timeline.
 * Access: own case, team member's case, or HR/admin.
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

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.VIEW_SICKNESS_CASES, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const sicknessCase = await SicknessCaseService.getById(id, organisationId);

    if (!sicknessCase) {
      return NextResponse.json({ error: "Sickness case not found" }, { status: 404 });
    }

    // Check access: own case, team member, or admin/HR
    const isAdminOrHR = sessionUser.isSuperAdmin || sessionUser.roles.some(
      (r) =>
        r.organisationId === organisationId &&
        (r.role === UserRole.ORG_ADMIN || r.role === UserRole.HR),
    );

    if (!isAdminOrHR) {
      const currentEmployee = await EmployeeRepository.findByUserId(sessionUser.id);
      if (!currentEmployee) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const isOwnCase = sicknessCase.employeeId === currentEmployee.id;
      if (!isOwnCase) {
        // Check if the case employee is in the user's team
        const team = await EmployeeRepository.getReportingChain(currentEmployee.id);
        const isTeamMember = team.some((e) => e.id === sicknessCase.employeeId);
        if (!isTeamMember) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    }

    // Get transitions timeline
    const transitions = await SicknessCaseService.getTransitions(id);

    // Get available actions
    const availableActions = WorkflowService.getAvailableActions(sicknessCase.status as SicknessState);

    // Determine if user can manage this case
    const canManage = AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_SICKNESS_CASES, organisationId);

    return NextResponse.json({
      sicknessCase,
      transitions,
      availableActions,
      canManage,
    });
  } catch (error) {
    console.error("Error in GET /api/sickness-cases/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/sickness-cases/[id]
 * Update a sickness case (e.g., set end date).
 * Does NOT allow direct status changes (must use /transition endpoint).
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

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_SICKNESS_CASES, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    // If start date is provided, use updateDates (handles both dates together)
    if (body.absenceStartDate) {
      if (!dateRegex.test(body.absenceStartDate)) {
        return NextResponse.json({ error: "Invalid start date format. Use YYYY-MM-DD." }, { status: 400 });
      }
      const endDate = body.absenceEndDate || null;
      if (endDate && !dateRegex.test(endDate)) {
        return NextResponse.json({ error: "Invalid end date format. Use YYYY-MM-DD." }, { status: 400 });
      }

      const updatedCase = await SicknessCaseService.updateDates(
        id,
        body.absenceStartDate,
        endDate,
        organisationId,
        sessionUser.id,
      );

      return NextResponse.json({ sicknessCase: updatedCase });
    }

    // End date only update (existing behaviour)
    if (body.absenceEndDate) {
      if (!dateRegex.test(body.absenceEndDate)) {
        return NextResponse.json({ error: "Invalid end date format. Use YYYY-MM-DD." }, { status: 400 });
      }

      const updatedCase = await SicknessCaseService.updateEndDate(
        id,
        body.absenceEndDate,
        organisationId,
        sessionUser.id,
      );

      return NextResponse.json({ sicknessCase: updatedCase });
    }

    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  } catch (error: any) {
    if (error.message === "Sickness case not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Error in PATCH /api/sickness-cases/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
