import { redirect } from "next/navigation";
import Link from "next/link";
import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { AuthService } from "@/providers/services/auth.service";
import { OrganisationService } from "@/providers/services/organisation.service";
import { PERMISSIONS } from "@/constants/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Settings, UserPlus } from "lucide-react";
import { AdminManagement } from "./admin-management";

const auth0 = new Auth0Client();

export default async function OrganisationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth0.getSession();
  if (!session) redirect("/auth/login");

  const sessionUser = await AuthService.getSessionUser(session.user.sub);
  if (!sessionUser) redirect("/auth/login");

  const organisation = await OrganisationService.getBySlug(slug);
  if (!organisation) redirect("/organisations");

  // Check permission: platform admin or org member
  const isPlatformAdmin = AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_ORGANISATIONS);
  const isOrgMember = sessionUser.roles.some((r) => r.organisationId === organisation.id);
  if (!isPlatformAdmin && !isOrgMember) redirect("/dashboard");

  const stats = await OrganisationService.getDashboardStats(organisation.id);
  const admins = await OrganisationService.getAdmins(organisation.id);

  const statusVariant =
    organisation.status === "ACTIVE" ? "success" : organisation.status === "SUSPENDED" ? "warning" : "destructive";

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">{organisation.name}</h1>
            <Badge variant={statusVariant}>{organisation.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500">/{organisation.slug}</p>
        </div>
        <Link href={`/organisations/${slug}/settings`}>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                ? stats.departments.map((d) => d.name).join(", ")
                : "No departments yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Absences</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAbsences}</div>
            <p className="text-xs text-gray-500">Absence tracking available in Phase 2</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin management */}
      {isPlatformAdmin && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Organisation Admins</CardTitle>
              <CardDescription>Manage who has admin access to this organisation.</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminManagement
                slug={slug}
                admins={admins.map((a) => ({
                  id: a.id,
                  email: a.email,
                  firstName: a.firstName,
                  lastName: a.lastName,
                }))}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
