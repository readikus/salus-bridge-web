import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { SicknessCaseService } from "@/providers/services/sickness-case.service";
import { EmployeeRepository } from "@/providers/repositories/employee.repository";
import { PERMISSIONS } from "@/constants/permissions";
import { UserRole } from "@/types/enums";
import { AbsenceCalendar, AbsenceEntry } from "@/components/absence-calendar";
import { SicknessCase } from "@/types/database";

interface Props {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function CalendarPage({ searchParams }: Props) {
  const sessionUser = await getAuthenticatedUser();
  if (!sessionUser) redirect("/login");

  const organisationId = sessionUser.currentOrganisationId;
  if (!organisationId) redirect("/dashboard");

  // Check permission: VIEW_ABSENCE_CALENDAR (MANAGER, HR, ORG_ADMIN)
  if (!AuthService.validateAccess(sessionUser, PERMISSIONS.VIEW_ABSENCE_CALENDAR, organisationId)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const now = new Date();
  const month = params.month ? parseInt(params.month, 10) : now.getMonth() + 1;
  const year = params.year ? parseInt(params.year, 10) : now.getFullYear();

  // Determine role-based access scope
  const isAdminOrHR =
    sessionUser.isSuperAdmin ||
    sessionUser.roles.some(
      (r) =>
        r.organisationId === organisationId &&
        (r.role === UserRole.ORG_ADMIN || r.role === UserRole.HR),
    );

  const isManager = sessionUser.roles.some(
    (r) => r.organisationId === organisationId && r.role === UserRole.MANAGER,
  );

  let cases: SicknessCase[] = [];

  if (isAdminOrHR) {
    cases = await SicknessCaseService.getForOrganisation(organisationId);
  } else if (isManager) {
    const managerEmployee = await EmployeeRepository.findByUserId(sessionUser.id);
    if (managerEmployee) {
      cases = await SicknessCaseService.getForManagerTeam(managerEmployee.id, organisationId);
    }
  }

  // Get employee details for each case to build absence entries
  const absenceEntries: AbsenceEntry[] = [];

  for (const c of cases) {
    // Filter: only show cases that overlap with the selected month
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    const caseStart = new Date(c.absenceStartDate);
    const caseEnd = c.absenceEndDate ? new Date(c.absenceEndDate) : null;

    // Case overlaps month if: start <= monthEnd AND (end >= monthStart OR end is null)
    if (caseStart > monthEnd) continue;
    if (caseEnd && caseEnd < monthStart) continue;

    // Get employee name
    const employee = await EmployeeRepository.findByIdWithDetails(c.employeeId);
    const employeeName = employee
      ? [employee.firstName, employee.lastName].filter(Boolean).join(" ") || "Unknown"
      : "Unknown";

    absenceEntries.push({
      employeeName,
      startDate: c.absenceStartDate,
      endDate: c.absenceEndDate || undefined,
      status: c.status,
      absenceType: c.absenceType,
      caseId: c.id,
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Absence Calendar</h1>
        <p className="mt-1 text-sm text-gray-500">
          View team absences at a glance. Click on an absence to view case details.
        </p>
      </div>

      <AbsenceCalendar absences={absenceEntries} month={month} year={year} />
    </div>
  );
}
