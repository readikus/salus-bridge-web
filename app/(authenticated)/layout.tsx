import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { Sidebar } from "@/components/sidebar";
import { QueryProvider } from "@/components/query-provider";
import { UserRole } from "@/types/enums";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessionUser = await getAuthenticatedUser();

  if (!sessionUser) {
    redirect("/login");
  }

  const roles = sessionUser.roles.map((r) => r.role as UserRole);
  const displayName = [sessionUser.firstName, sessionUser.lastName].filter(Boolean).join(" ") || null;

  // Build deduplicated org list from roles
  const orgMap = new Map<string, string>();
  for (const r of sessionUser.roles) {
    if (!orgMap.has(r.organisationId)) {
      orgMap.set(r.organisationId, r.organisationName);
    }
  }
  const organisations = Array.from(orgMap, ([id, name]) => ({ id, name }));

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        userEmail={sessionUser.email}
        userName={displayName}
        currentOrganisationId={sessionUser.currentOrganisationId}
        organisations={organisations}
        roles={roles}
        isSuperAdmin={sessionUser.isSuperAdmin}
      />
      <main className="flex-1 overflow-y-auto">
        <QueryProvider>
          <div className="p-8">{children}</div>
        </QueryProvider>
      </main>
    </div>
  );
}
