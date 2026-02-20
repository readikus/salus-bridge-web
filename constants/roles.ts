import { UserRole } from "@/types/enums";

/**
 * Role hierarchy levels — higher number = more authority.
 * Used for determining role precedence when a user has multiple roles.
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.PLATFORM_ADMIN]: 5,
  [UserRole.ORG_ADMIN]: 4,
  [UserRole.HR]: 3,
  [UserRole.MANAGER]: 2,
  [UserRole.EMPLOYEE]: 1,
};

/**
 * Hardcoded list of super admin emails.
 * Per CLAUDE.md pattern: UserService.isSuperAdmin() checks against this list.
 */
export const SUPER_ADMIN_EMAILS: string[] = [
  "ianharveyread@gmail.com",
];

/**
 * Get the highest role from a list of roles.
 */
export function getHighestRole(roles: UserRole[]): UserRole | null {
  if (roles.length === 0) return null;

  return roles.reduce((highest, current) =>
    ROLE_HIERARCHY[current] > ROLE_HIERARCHY[highest] ? current : highest,
  );
}
