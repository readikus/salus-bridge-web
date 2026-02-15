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
  REPORT_SICKNESS: "report:sickness",
  VIEW_SICKNESS_CASES: "view:sickness_cases",
  MANAGE_SICKNESS_CASES: "manage:sickness_cases",
  VIEW_FIT_NOTES: "view:fit_notes",
  UPLOAD_FIT_NOTES: "upload:fit_notes",
  SCHEDULE_RTW: "schedule:rtw",
  COMPLETE_RTW: "complete:rtw",
  VIEW_GUIDANCE: "view:guidance",
  VIEW_ABSENCE_CALENDAR: "view:absence_calendar",
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
    PERMISSIONS.REPORT_SICKNESS,
    PERMISSIONS.VIEW_SICKNESS_CASES,
    PERMISSIONS.MANAGE_SICKNESS_CASES,
    PERMISSIONS.VIEW_FIT_NOTES,
    PERMISSIONS.UPLOAD_FIT_NOTES,
    PERMISSIONS.SCHEDULE_RTW,
    PERMISSIONS.COMPLETE_RTW,
    PERMISSIONS.VIEW_GUIDANCE,
    PERMISSIONS.VIEW_ABSENCE_CALENDAR,
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
    PERMISSIONS.REPORT_SICKNESS,
    PERMISSIONS.VIEW_SICKNESS_CASES,
    PERMISSIONS.MANAGE_SICKNESS_CASES,
    PERMISSIONS.VIEW_FIT_NOTES,
    PERMISSIONS.UPLOAD_FIT_NOTES,
    PERMISSIONS.SCHEDULE_RTW,
    PERMISSIONS.COMPLETE_RTW,
    PERMISSIONS.VIEW_GUIDANCE,
    PERMISSIONS.VIEW_ABSENCE_CALENDAR,
  ],
  [UserRole.HR]: [
    PERMISSIONS.MANAGE_EMPLOYEES,
    PERMISSIONS.VIEW_EMPLOYEES,
    PERMISSIONS.VIEW_OWN_DATA,
    PERMISSIONS.IMPORT_EMPLOYEES,
    PERMISSIONS.SEND_INVITATIONS,
    PERMISSIONS.REPORT_SICKNESS,
    PERMISSIONS.VIEW_SICKNESS_CASES,
    PERMISSIONS.MANAGE_SICKNESS_CASES,
    PERMISSIONS.VIEW_FIT_NOTES,
    PERMISSIONS.UPLOAD_FIT_NOTES,
    PERMISSIONS.SCHEDULE_RTW,
    PERMISSIONS.COMPLETE_RTW,
    PERMISSIONS.VIEW_GUIDANCE,
    PERMISSIONS.VIEW_ABSENCE_CALENDAR,
  ],
  [UserRole.MANAGER]: [
    PERMISSIONS.VIEW_EMPLOYEES,
    PERMISSIONS.VIEW_OWN_DATA,
    PERMISSIONS.REPORT_SICKNESS,
    PERMISSIONS.VIEW_SICKNESS_CASES,
    PERMISSIONS.SCHEDULE_RTW,
    PERMISSIONS.COMPLETE_RTW,
    PERMISSIONS.VIEW_GUIDANCE,
    PERMISSIONS.VIEW_ABSENCE_CALENDAR,
  ],
  [UserRole.EMPLOYEE]: [
    PERMISSIONS.VIEW_OWN_DATA,
    PERMISSIONS.REPORT_SICKNESS,
    PERMISSIONS.VIEW_SICKNESS_CASES,
    PERMISSIONS.VIEW_FIT_NOTES,
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
