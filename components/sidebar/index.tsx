"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, Shield } from "lucide-react";
import { UserRole } from "@/types/enums";
import { createBrowserClient } from "@/providers/supabase/browser-client";
import { getNavItemsForRoles } from "./nav-items";

interface Props {
  userEmail: string;
  userName: string | null;
  organisationName: string | null;
  roles: UserRole[];
  isSuperAdmin: boolean;
}

export function Sidebar({ userEmail, userName, organisationName, roles, isSuperAdmin }: Props) {
  const pathname = usePathname();

  const navItems = getNavItemsForRoles(roles, isSuperAdmin);

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-200 px-6 py-5">
        <Shield className="h-6 w-6 text-blue-600" />
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-gray-900">SalusBridge</h1>
          {organisationName && (
            <p className="truncate text-xs text-gray-500">{organisationName}</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-200 px-4 py-4">
        <div className="mb-3 min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">
            {userName || userEmail}
          </p>
          {userName && (
            <p className="truncate text-xs text-gray-500">{userEmail}</p>
          )}
          {isSuperAdmin && (
            <span className="mt-1 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
              Super Admin
            </span>
          )}
        </div>
        <button
          onClick={() => {
            const supabase = createBrowserClient();
            supabase.auth.signOut().then(() => { window.location.href = "/login"; });
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
