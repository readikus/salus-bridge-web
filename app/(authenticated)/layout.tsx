import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { Sidebar } from "@/components/sidebar";
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
  const organisationName = sessionUser.roles.length > 0 ? sessionUser.roles[0].organisationName : null;
  const displayName = [sessionUser.firstName, sessionUser.lastName].filter(Boolean).join(" ") || null;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        userEmail={sessionUser.email}
        userName={displayName}
        organisationName={organisationName}
        roles={roles}
        isSuperAdmin={sessionUser.isSuperAdmin}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
