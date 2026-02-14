import { UserService } from "@/providers/services/user.service";
import { UserRepository } from "@/providers/repositories/user.repository";
import { UserRoleRepository } from "@/providers/repositories/user-role.repository";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { hasPermission } from "@/constants/permissions";
import { AuditAction, AuditEntity } from "@/types/enums";
import { Auth0Profile, SessionUser } from "@/types/auth";

export class AuthService {
  /**
   * Handle the Auth0 login callback.
   * Orchestrates: find/create user, load roles, determine current org.
   */
  static async handleLoginCallback(auth0Profile: Auth0Profile): Promise<SessionUser> {
    // Find or create the local user
    const user = await UserService.findOrCreateFromAuth0(auth0Profile);

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
        auth0Id: auth0Profile.sub,
        isSuperAdmin,
        roleCount: roles.length,
      },
    });

    return {
      id: user.id,
      email: user.email,
      auth0Id: user.auth0Id!,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      currentOrganisationId,
      isSuperAdmin,
    };
  }

  /**
   * Get the current session user by Auth0 ID.
   * Used by /api/auth/me to hydrate client-side state.
   */
  static async getSessionUser(auth0Id: string): Promise<SessionUser | null> {
    const user = await UserRepository.findByAuth0Id(auth0Id);
    if (!user) return null;

    return UserService.getUserWithRoles(user.id);
  }

  /**
   * Validate if a user has a specific permission, optionally scoped to an org.
   */
  static validateAccess(
    user: SessionUser,
    permission: string,
    organisationId?: string,
  ): boolean {
    // Super admins have all permissions
    if (user.isSuperAdmin) return true;

    return hasPermission(user.roles, permission, organisationId);
  }
}
