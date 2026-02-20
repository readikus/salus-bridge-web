import { UserService } from "@/providers/services/user.service";
import { UserRepository } from "@/providers/repositories/user.repository";
import { UserRoleRepository } from "@/providers/repositories/user-role.repository";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { hasPermission } from "@/constants/permissions";
import { AuditAction, AuditEntity } from "@/types/enums";
import { AuthProfile, SessionUser } from "@/types/auth";

export class AuthService {
  /**
   * Handle the login callback.
   * Orchestrates: find/create user, load roles, determine current org.
   */
  static async handleLoginCallback(authProfile: AuthProfile): Promise<SessionUser> {
    // Find or create the local user
    const user = await UserService.findOrCreateFromAuth(authProfile);

    // Load roles
    const roles = await UserRoleRepository.findByUserId(user.id);

    // Determine current organisation ID
    // Platform admins without org roles get null (platform-level context)
    // Others default to their first org
    const isSuperAdmin = UserService.isSuperAdmin(user.email);
    const currentOrganisationId = roles.length > 0 ? roles[0].organisationId : null;

    // Log the login
    await AuditLogService.log({
      userId: user.id,
      organisationId: currentOrganisationId || undefined,
      action: AuditAction.LOGIN,
      entity: AuditEntity.USER,
      entityId: user.id,
      metadata: {
        supabaseAuthId: authProfile.id,
        isSuperAdmin,
        roleCount: roles.length,
      },
    });

    return {
      id: user.id,
      email: user.email,
      supabaseAuthId: user.supabaseAuthId!,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      currentOrganisationId,
      isSuperAdmin,
    };
  }

  /**
   * Get the current session user by Supabase Auth ID.
   * Used by /api/auth/me to hydrate client-side state.
   */
  static async getSessionUser(supabaseAuthId: string, preferredOrgId?: string | null): Promise<SessionUser | null> {
    const user = await UserRepository.findBySupabaseAuthId(supabaseAuthId);
    if (!user) return null;

    return UserService.getUserWithRoles(user.id, preferredOrgId);
  }

  /**
   * Validate if a user has a specific permission, optionally scoped to an org.
   */
  static validateAccess(user: SessionUser, permission: string, organisationId?: string): boolean {
    // Super admins have all permissions
    if (user.isSuperAdmin) return true;

    return hasPermission(user.roles, permission, organisationId);
  }
}
