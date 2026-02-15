import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { OrganisationService } from "@/providers/services/organisation.service";
import { SicknessCaseService } from "@/providers/services/sickness-case.service";
import { EmployeeRepository } from "@/providers/repositories/employee.repository";
import { UserRole } from "@/types/enums";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, UserCircle, FileText, Heart, Calendar } from "lucide-react";

const ACTIVE_STATUSES = ["REPORTED", "TRACKING", "FIT_NOTE_RECEIVED", "RTW_SCHEDULED"];

export default async function DashboardPage() {
  const sessionUser = await getAuthenticatedUser();
  if (!sessionUser) redirect("/login");

  const roles = sessionUser.roles.map((r) => r.role);

  // Platform admin: redirect to organisations
  if (sessionUser.isSuperAdmin || roles.includes(UserRole.PLATFORM_ADMIN)) {
    redirect("/organisations");
  }

  // Determine the primary role for dashboard rendering
  const isOrgAdmin = roles.includes(UserRole.ORG_ADMIN);
  const isHR = roles.includes(UserRole.HR);
  const isManager = roles.includes(UserRole.MANAGER);
  const organisationId = sessionUser.currentOrganisationId;

  // Org admin / HR dashboard
  if ((isOrgAdmin || isHR) && organisationId) {
    const stats = await OrganisationService.getDashboardStats(organisationId);
    const orgName =
      sessionUser.roles.find((r) => r.organisationId === organisationId)?.organisationName || "Organisation";

    // Get active absence count
    let activeAbsenceCount = 0;
    try {
      const allCases = await SicknessCaseService.getForOrganisation(organisationId);
      activeAbsenceCount = allCases.filter((c) => ACTIVE_STATUSES.includes(c.status)).length;
    } catch {
      // Silently handle -- dashboard should still render
    }

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{orgName} Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Overview of your organisation.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.employeeCount}</div>
              <p className="text-xs text-gray-500">{stats.activeEmployeeCount} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departments</CardTitle>
              <Building2 className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.departmentCount}</div>
              <p className="text-xs text-gray-500">
                {stats.departments.length > 0
                  ? stats.departments
                      .slice(0, 3)
                      .map((d) => d.name)
                      .join(", ")
                  : "No departments yet"}
              </p>
            </CardContent>
          </Card>

          <Link href="/calendar">
            <Card className="transition-shadow hover:shadow-md cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Absences</CardTitle>
                <Calendar className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeAbsenceCount}</div>
                <p className="text-xs text-blue-600">View absence calendar</p>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <UserCircle className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-gray-500">Organisation management</p>
            </CardContent>
          </Card>
        </div>

        {/* Department breakdown */}
        {stats.departments.length > 0 && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Departments</CardTitle>
                <CardDescription>Breakdown of employees by department.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.departments.map((dept) => (
                    <div
                      key={dept.id}
                      className="flex items-center justify-between rounded-md border border-gray-200 p-3"
                    >
                      <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Manager dashboard
  if (isManager && organisationId) {
    // Get team absence count
    let teamAbsenceCount = 0;
    try {
      const managerEmployee = await EmployeeRepository.findByUserId(sessionUser.id);
      if (managerEmployee) {
        const teamCases = await SicknessCaseService.getForManagerTeam(managerEmployee.id, organisationId);
        teamAbsenceCount = teamCases.filter((c) => ACTIVE_STATUSES.includes(c.status)).length;
      }
    } catch {
      // Silently handle
    }

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">My Team</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your direct reports and team members.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Direct Reports</CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-gray-500">Employee management coming soon</p>
            </CardContent>
          </Card>

          <Link href="/calendar">
            <Card className="transition-shadow hover:shadow-md cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Absences</CardTitle>
                <Calendar className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamAbsenceCount}</div>
                <p className="text-xs text-blue-600">View absence calendar</p>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
              <FileText className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-gray-500">No actions required</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Employee dashboard (default)
  const displayName =
    [sessionUser.firstName, sessionUser.lastName].filter(Boolean).join(" ") || sessionUser.email;

  // Get employee's own absence count
  let myAbsenceCount = 0;
  if (organisationId) {
    try {
      const employee = await EmployeeRepository.findByUserId(sessionUser.id);
      if (employee) {
        const myCases = await SicknessCaseService.getForEmployee(employee.id, organisationId);
        myAbsenceCount = myCases.filter((c) => ACTIVE_STATUSES.includes(c.status)).length;
      }
    } catch {
      // Silently handle
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Welcome, {displayName}</h1>
        <p className="mt-1 text-sm text-gray-500">Your personal dashboard at SalusBridge.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Profile</CardTitle>
            <UserCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">View and update your personal information.</p>
            <p className="mt-2 text-xs text-blue-600">View Profile</p>
          </CardContent>
        </Card>

        <Link href="/sickness/history">
          <Card className="transition-shadow hover:shadow-md cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Absences</CardTitle>
              <Calendar className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myAbsenceCount}</div>
              <p className="text-xs text-gray-500">{myAbsenceCount === 1 ? "active absence" : "active absences"}</p>
              <p className="mt-1 text-xs text-blue-600">View history</p>
            </CardContent>
          </Card>
        </Link>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Documents</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Access your employment documents.</p>
            <p className="mt-2 text-xs text-gray-400">Coming soon</p>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Wellbeing</CardTitle>
            <Heart className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Wellbeing resources and support.</p>
            <p className="mt-2 text-xs text-gray-400">Coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
