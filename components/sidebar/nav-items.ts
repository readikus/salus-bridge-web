import { UserRole } from "@/types/enums";
import {
  Building2,
  Users,
  ScrollText,
  LayoutDashboard,
  UserCog,
  Settings,
  UserCircle,
  UsersRound,
  LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
}

/**
 * Navigation items filtered by role.
 * Per user decision: shared layout with filtered navigation.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: [UserRole.ORG_ADMIN, UserRole.HR, UserRole.MANAGER, UserRole.EMPLOYEE],
  },
  {
    label: "Organisations",
    href: "/organisations",
    icon: Building2,
    roles: [UserRole.PLATFORM_ADMIN],
  },
  {
    label: "Users",
    href: "/users",
    icon: Users,
    roles: [UserRole.PLATFORM_ADMIN],
  },
  {
    label: "Employees",
    href: "/employees",
    icon: UserCog,
    roles: [UserRole.ORG_ADMIN, UserRole.HR],
  },
  {
    label: "Departments",
    href: "/departments",
    icon: Building2,
    roles: [UserRole.ORG_ADMIN],
  },
  {
    label: "My Team",
    href: "/my-team",
    icon: UsersRound,
    roles: [UserRole.MANAGER],
  },
  {
    label: "My Profile",
    href: "/my-profile",
    icon: UserCircle,
    roles: [UserRole.EMPLOYEE],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: [UserRole.ORG_ADMIN],
  },
  {
    label: "Audit Log",
    href: "/audit-log",
    icon: ScrollText,
    roles: [UserRole.PLATFORM_ADMIN, UserRole.ORG_ADMIN],
  },
];

/**
 * Filter nav items based on user's roles.
 */
export function getNavItemsForRoles(userRoles: UserRole[]): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.some((role) => userRoles.includes(role)));
}
