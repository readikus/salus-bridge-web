import { UserRole } from "@/types/enums";
import { UserRoleWithOrg } from "@/types/auth";

/**
 * Permission string constants for RBAC.
 */
export const PERMISSIONS = {
  MANAGE_ORGANISATIONS: "manage:organisations",
  MANAGE_EMPLOYEES: "manage:employees",
  MANAGE_ROLES: "manage:roles",
  VIEW_EMPLOYEES: "view:employees",
  VIEW_OWN_DATA: "view:own_data",
  IMPORT_EMPLOYEES: "import:employees",
  VIEW_AUDIT_LOG: "view:audit_log",
  SEND_INVITATIONS: "send:invitations",
  MANAGE_SETTINGS: "manage:settings",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Role-to-permission mapping.
 * Each role has a set of allowed permissions.
 * Permissions are additive across roles (per user decision).
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.PLATFORM_ADMIN]: [
    PERMISSIONS.MANAGE_ORGANISATIONS,
    PERMISSIONS.MANAGE_EMPLOYEES,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.VIEW_EMPLOYEES,
    PERMISSIONS.VIEW_OWN_DATA,
    PERMISSIONS.IMPORT_EMPLOYEES,
    PERMISSIONS.VIEW_AUDIT_LOG,
    PERMISSIONS.SEND_INVITATIONS,
    PERMISSIONS.MANAGE_SETTINGS,
  ],
  [UserRole.ORG_ADMIN]: [
    PERMISSIONS.MANAGE_EMPLOYEES,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.VIEW_EMPLOYEES,
    PERMISSIONS.VIEW_OWN_DATA,
    PERMISSIONS.IMPORT_EMPLOYEES,
    PERMISSIONS.VIEW_AUDIT_LOG,
    PERMISSIONS.SEND_INVITATIONS,
    PERMISSIONS.MANAGE_SETTINGS,
  ],
  [UserRole.HR]: [
    PERMISSIONS.MANAGE_EMPLOYEES,
    PERMISSIONS.VIEW_EMPLOYEES,
    PERMISSIONS.VIEW_OWN_DATA,
    PERMISSIONS.IMPORT_EMPLOYEES,
    PERMISSIONS.SEND_INVITATIONS,
  ],
  [UserRole.MANAGER]: [
    PERMISSIONS.VIEW_EMPLOYEES,
    PERMISSIONS.VIEW_OWN_DATA,
  ],
  [UserRole.EMPLOYEE]: [
    PERMISSIONS.VIEW_OWN_DATA,
  ],
};

/**
 * Check if any of the user's roles grant the specified permission.
 * Optionally scoped to a specific organisation.
 *
 * Permissions are additive across roles — if any role grants the permission, access is allowed.
 */
export function hasPermission(
  userRoles: UserRoleWithOrg[],
  permission: string,
  organisationId?: string,
): boolean {
  return userRoles.some((userRole) => {
    // If organisationId is specified, only check roles for that org
    if (organisationId && userRole.organisationId !== organisationId) {
      // Platform admin roles (no specific org) always apply
      if (userRole.role !== UserRole.PLATFORM_ADMIN) {
        return false;
      }
    }

    const rolePermissions = ROLE_PERMISSIONS[userRole.role] || [];
    return rolePermissions.includes(permission);
  });
}

/**
 * Get all permissions for a set of roles.
 */
export function getAllPermissions(userRoles: UserRoleWithOrg[]): string[] {
  const permissionSet = new Set<string>();

  for (const userRole of userRoles) {
    const rolePermissions = ROLE_PERMISSIONS[userRole.role] || [];
    for (const permission of rolePermissions) {
      permissionSet.add(permission);
    }
  }

  return Array.from(permissionSet);
}
