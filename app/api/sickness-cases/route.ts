import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { SicknessCaseService } from "@/providers/services/sickness-case.service";
import { EmployeeRepository } from "@/providers/repositories/employee.repository";
import { PERMISSIONS } from "@/constants/permissions";
import { createSicknessCaseSchema } from "@/schemas/sickness-case";
import { UserRole } from "@/types/enums";

/**
 * GET /api/sickness-cases
 * List sickness cases for the current organisation.
 * Role-based filtering: EMPLOYEE sees own only, MANAGER sees team, HR/ORG_ADMIN sees all.
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

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.VIEW_SICKNESS_CASES, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = request.nextUrl;
    const filters = {
      status: searchParams.get("status") || undefined,
      employeeId: searchParams.get("employeeId") || undefined,
      search: searchParams.get("search") || undefined,
      startDateFrom: searchParams.get("startDateFrom") || undefined,
      startDateTo: searchParams.get("startDateTo") || undefined,
    };

    // Determine role-based access scope
    const isAdminOrHR = sessionUser.isSuperAdmin || sessionUser.roles.some(
      (r) =>
        r.organisationId === organisationId &&
        (r.role === UserRole.ORG_ADMIN || r.role === UserRole.HR),
    );

    const isManager = sessionUser.roles.some(
      (r) => r.organisationId === organisationId && r.role === UserRole.MANAGER,
    );

    let cases;

    if (isAdminOrHR) {
      // HR/ORG_ADMIN: see all org cases
      cases = await SicknessCaseService.getForOrganisation(organisationId, filters);
    } else if (isManager) {
      // MANAGER: see team cases only
      const managerEmployee = await EmployeeRepository.findByUserId(sessionUser.id);
      if (managerEmployee) {
        cases = await SicknessCaseService.getForManagerTeam(managerEmployee.id, organisationId);
      } else {
        cases = [];
      }
    } else {
      // EMPLOYEE: see own cases only
      const employee = await EmployeeRepository.findByUserId(sessionUser.id);
      if (employee) {
        cases = await SicknessCaseService.getForEmployee(employee.id, organisationId);
      } else {
        cases = [];
      }
    }

    return NextResponse.json({ cases, total: cases.length });
  } catch (error) {
    console.error("Error in GET /api/sickness-cases:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/sickness-cases
 * Create a new sickness case.
 * Employee self-reporting: employeeId must match own record.
 * Manager reporting: target employee must be in their reporting chain.
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

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.REPORT_SICKNESS, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = createSicknessCaseSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const data = parseResult.data;

    // Determine access scope
    const isAdminOrHR = sessionUser.isSuperAdmin || sessionUser.roles.some(
      (r) =>
        r.organisationId === organisationId &&
        (r.role === UserRole.ORG_ADMIN || r.role === UserRole.HR),
    );

    if (!isAdminOrHR) {
      const isManager = sessionUser.roles.some(
        (r) => r.organisationId === organisationId && r.role === UserRole.MANAGER,
      );

      const currentEmployee = await EmployeeRepository.findByUserId(sessionUser.id);

      if (isManager && currentEmployee) {
        // Manager: validate target is in their reporting chain or is themselves
        if (data.employeeId !== currentEmployee.id) {
          const team = await EmployeeRepository.getReportingChain(currentEmployee.id);
          const teamIds = team.map((e) => e.id);
          if (!teamIds.includes(data.employeeId)) {
            return NextResponse.json(
              { error: "You can only report sickness for employees in your team" },
              { status: 403 },
            );
          }
        }
      } else if (currentEmployee) {
        // Employee: can only report for themselves
        if (data.employeeId !== currentEmployee.id) {
          return NextResponse.json(
            { error: "You can only report sickness for yourself" },
            { status: 403 },
          );
        }
      } else {
        return NextResponse.json({ error: "No employee record found" }, { status: 400 });
      }
    }

    const sicknessCase = await SicknessCaseService.create(data, sessionUser.id, organisationId);

    return NextResponse.json({ sicknessCase }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/sickness-cases:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
