import { UserRole } from "./enums";

/**
 * Represents a user's role within a specific organisation.
 */
export interface UserRoleWithOrg {
  role: UserRole;
  organisationId: string;
  organisationName: string;
}

/**
 * Extended session user with roles and tenant context.
 * This is the primary auth type used throughout the application.
 */
export interface SessionUser {
  id: string;
  email: string;
  supabaseAuthId: string;
  firstName: string | null;
  lastName: string | null;
  roles: UserRoleWithOrg[];
  currentOrganisationId: string | null;
  isSuperAdmin: boolean;
}

/**
 * Auth profile as received from Supabase Auth.
 */
export interface AuthProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Permission string type for RBAC checks.
 */
export type Permission = string;

/**
 * Permission check function signature.
 */
export type PermissionCheck = (permission: Permission, organisationId?: string) => boolean;

/**
 * API response for /api/auth/me endpoint.
 */
export interface AuthMeResponse {
  user: SessionUser;
  permissions: string[];
}
