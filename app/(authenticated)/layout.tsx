import { redirect } from "next/navigation";
import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { AuthService } from "@/providers/services/auth.service";
import { Sidebar } from "@/components/sidebar";
import { UserRole } from "@/types/enums";

const auth0 = new Auth0Client();

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  // Load the full session user with roles from the database
  let sessionUser = await AuthService.getSessionUser(session.user.sub);

  // If user doesn't exist locally yet (first login), create them
  if (!sessionUser) {
    sessionUser = await AuthService.handleLoginCallback({
      sub: session.user.sub,
      email: session.user.email!,
      given_name: session.user.given_name,
      family_name: session.user.family_name,
    });
  }

  const roles = sessionUser.roles.map((r) => r.role as UserRole);
  const organisationName =
    sessionUser.roles.length > 0 ? sessionUser.roles[0].organisationName : null;
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
