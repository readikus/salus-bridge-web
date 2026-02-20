import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { OrganisationService } from "@/providers/services/organisation.service";
import { OrganisationRepository } from "@/providers/repositories/organisation.repository";
import { PERMISSIONS } from "@/constants/permissions";
import { OrganisationListClient } from "./organisation-list-client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function OrganisationsPage() {
  const sessionUser = await getAuthenticatedUser();
  if (!sessionUser) redirect("/login");

  // Platform admin only
  if (!AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_ORGANISATIONS)) {
    redirect("/dashboard");
  }

  const organisations = await OrganisationService.list();

  // Get employee counts for each org
  const orgsWithStats = await Promise.all(
    organisations.map(async (org) => {
      const stats = await OrganisationRepository.getStats(org.id);
      return { ...org, employeeCount: stats.employeeCount };
    }),
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Organisations</h1>
          <p className="mt-1 text-sm text-gray-500">Manage all organisations on the platform.</p>
        </div>
        <Link href="/organisations/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Organisation
          </Button>
        </Link>
      </div>

      <div className="mt-6">
        <OrganisationListClient organisations={orgsWithStats} />
      </div>
    </div>
  );
}
