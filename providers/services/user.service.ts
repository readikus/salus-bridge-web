import { UserRepository } from "@/providers/repositories/user.repository";
import { UserRoleRepository } from "@/providers/repositories/user-role.repository";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { SUPER_ADMIN_EMAILS } from "@/constants/roles";
import { User } from "@/types/database";
import { UserRole, AuditAction, AuditEntity } from "@/types/enums";
import { AuthProfile, SessionUser } from "@/types/auth";

export class UserService {
  /**
   * Find or create a local user from an auth profile.
   * Lookup order: supabase_auth_id first, then email, then create new.
   */
  static async findOrCreateFromAuth(authProfile: AuthProfile): Promise<User> {
    // 1. Try by Supabase Auth ID
    let user = await UserRepository.findBySupabaseAuthId(authProfile.id);
    if (user) {
      // Update name if changed
      if (authProfile.firstName !== user.firstName || authProfile.lastName !== user.lastName) {
        user = await UserRepository.update(user.id, {
          firstName: authProfile.firstName || user.firstName,
          lastName: authProfile.lastName || user.lastName,
        });
      }
      return user;
    }

    // 2. Try by email (user might exist from invitation before auth account was created)
    user = await UserRepository.findByEmail(authProfile.email);
    if (user) {
      // Link the Supabase Auth ID to the existing user
      user = await UserRepository.update(user.id, {
        supabaseAuthId: authProfile.id,
        firstName: authProfile.firstName || user.firstName,
        lastName: authProfile.lastName || user.lastName,
      });
      return user;
    }

    // 3. Create new user
    user = await UserRepository.create({
      email: authProfile.email,
      supabaseAuthId: authProfile.id,
      firstName: authProfile.firstName,
      lastName: authProfile.lastName,
    });

    await AuditLogService.log({
      userId: user.id,
      action: AuditAction.CREATE,
      entity: AuditEntity.USER,
      entityId: user.id,
      metadata: { source: "supabase_login", supabaseAuthId: authProfile.id },
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
  static async getUserWithRoles(userId: string, preferredOrgId?: string | null): Promise<SessionUser | null> {
    const user = await UserRepository.findById(userId);
    if (!user) return null;

    const roles = await UserRoleRepository.findByUserId(userId);

    // Determine current organisation:
    // 1. Use preferred org if valid (user has a role in it)
    // 2. Fall back to first org from roles
    // 3. null for platform-level (no org roles)
    let currentOrganisationId: string | null = null;
    if (roles.length > 0) {
      const hasPreferred = preferredOrgId && roles.some((r) => r.organisationId === preferredOrgId);
      currentOrganisationId = hasPreferred ? preferredOrgId! : roles[0].organisationId;
    }

    return {
      id: user.id,
      email: user.email,
      supabaseAuthId: user.supabaseAuthId!,
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
