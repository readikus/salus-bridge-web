import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { OrganisationService } from "@/providers/services/organisation.service";
import { EmployeeRepository } from "@/providers/repositories/employee.repository";
import { BradfordFactorService } from "@/providers/services/bradford-factor.service";
import { TenantService } from "@/providers/services/tenant.service";
import { PERMISSIONS } from "@/constants/permissions";

/**
 * GET /api/organisations/[slug]/bradford-factor
 * Returns Bradford Factor scores for all employees in the organisation.
 * Optional filter: ?departmentId=...
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const organisation = await OrganisationService.getBySlug(slug);
    if (!organisation) {
      return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
    }

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.VIEW_TRIGGERS, organisation.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const departmentId = searchParams.get("departmentId") || undefined;

    const employees = await TenantService.withTenant(organisation.id, false, async (client) => {
      return EmployeeRepository.findByOrganisation(
        organisation.id,
        departmentId ? { departmentId } : undefined,
        client,
      );
    });

    const employeeIds = employees.map((e) => e.id);
    const bradfordMap = await BradfordFactorService.calculateForTeam(employeeIds);

    const results = employees.map((e) => {
      const bf = bradfordMap.get(e.id) || { score: 0, spells: 0, totalDays: 0, riskLevel: "Low" };
      return {
        employeeId: e.id,
        firstName: e.firstName,
        lastName: e.lastName,
        departmentName: e.departmentName,
        score: bf.score,
        spells: bf.spells,
        totalDays: bf.totalDays,
        riskLevel: bf.riskLevel,
      };
    });

    return NextResponse.json({ employees: results });
  } catch (error) {
    console.error("Error in GET /api/organisations/[slug]/bradford-factor:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
