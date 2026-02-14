import { UserRepository } from "@/providers/repositories/user.repository";
import { UserRoleRepository } from "@/providers/repositories/user-role.repository";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { SUPER_ADMIN_EMAILS } from "@/constants/roles";
import { User } from "@/types/database";
import { UserRole, AuditAction, AuditEntity } from "@/types/enums";
import { Auth0Profile, SessionUser } from "@/types/auth";

export class UserService {
  /**
   * Find or create a local user from an Auth0 profile.
   * Lookup order: auth0_id first, then email, then create new.
   */
  static async findOrCreateFromAuth0(auth0Profile: Auth0Profile): Promise<User> {
    // 1. Try by Auth0 ID
    let user = await UserRepository.findByAuth0Id(auth0Profile.sub);
    if (user) {
      // Update name if changed
      if (
        auth0Profile.given_name !== user.firstName ||
        auth0Profile.family_name !== user.lastName
      ) {
        user = await UserRepository.update(user.id, {
          firstName: auth0Profile.given_name || user.firstName,
          lastName: auth0Profile.family_name || user.lastName,
        });
      }
      return user;
    }

    // 2. Try by email (user might exist from invitation before Auth0 account was created)
    user = await UserRepository.findByEmail(auth0Profile.email);
    if (user) {
      // Link the Auth0 ID to the existing user
      user = await UserRepository.update(user.id, {
        auth0Id: auth0Profile.sub,
        firstName: auth0Profile.given_name || user.firstName,
        lastName: auth0Profile.family_name || user.lastName,
      });
      return user;
    }

    // 3. Create new user
    user = await UserRepository.create({
      email: auth0Profile.email,
      auth0Id: auth0Profile.sub,
      firstName: auth0Profile.given_name,
      lastName: auth0Profile.family_name,
    });

    await AuditLogService.log({
      userId: user.id,
      action: AuditAction.CREATE,
      entity: AuditEntity.USER,
      entityId: user.id,
      metadata: { source: "auth0_login", auth0Id: auth0Profile.sub },
    });

    return user;
  }

  /**
   * Check if an email belongs to a super admin.
   * Per CLAUDE.md: determined by hardcoded email list.
   */
  static isSuperAdmin(email: string): boolean {
    return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
  }

  /**
   * Get a user with all their roles for session context.
   */
  static async getUserWithRoles(userId: string): Promise<SessionUser | null> {
    const user = await UserRepository.findById(userId);
    if (!user) return null;

    const roles = await UserRoleRepository.findByUserId(userId);

    // Determine current organisation: first org from roles, or null for platform-level
    const currentOrganisationId = roles.length > 0 ? roles[0].organisationId : null;

    return {
      id: user.id,
      email: user.email,
      auth0Id: user.auth0Id!,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      currentOrganisationId,
      isSuperAdmin: UserService.isSuperAdmin(user.email),
    };
  }

  /**
   * Assign a role to a user within an organisation.
   */
  static async assignRole(
    userId: string,
    organisationId: string,
    role: UserRole,
    assignedBy?: string,
  ): Promise<void> {
    await UserRoleRepository.create({
      userId,
      organisationId,
      role,
    });

    await AuditLogService.log({
      userId: assignedBy || userId,
      organisationId,
      action: AuditAction.CREATE,
      entity: AuditEntity.ROLE,
      entityId: userId,
      metadata: { role, assignedTo: userId },
    });
  }
}
