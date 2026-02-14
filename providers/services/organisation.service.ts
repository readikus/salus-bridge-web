import { OrganisationRepository } from "@/providers/repositories/organisation.repository";
import { DepartmentRepository } from "@/providers/repositories/department.repository";
import { UserRepository } from "@/providers/repositories/user.repository";
import { UserRoleRepository } from "@/providers/repositories/user-role.repository";
import { UserService } from "@/providers/services/user.service";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { Organisation, User, Department } from "@/types/database";
import { UserRole, AuditAction, AuditEntity } from "@/types/enums";
import { OrgStats } from "@/providers/repositories/organisation.repository";
import { OrgSettings } from "@/schemas/organisation";

export interface OrgDashboardStats {
  employeeCount: number;
  activeEmployeeCount: number;
  departmentCount: number;
  activeAbsences: number;
  departments: Department[];
}

export class OrganisationService {
  /**
   * Create a new organisation (PLAT-01).
   * Validates slug uniqueness, creates org, logs audit.
   */
  static async create(
    params: { name: string; slug: string; settings?: Record<string, unknown> },
    createdByUserId?: string,
  ): Promise<Organisation> {
    // Validate slug uniqueness
    const existing = await OrganisationRepository.findBySlug(params.slug);
    if (existing) {
      throw new Error(`Organisation with slug "${params.slug}" already exists`);
    }

    const org = await OrganisationRepository.create(params);

    await AuditLogService.log({
      userId: createdByUserId,
      organisationId: org.id,
      action: AuditAction.CREATE,
      entity: AuditEntity.ORGANISATION,
      entityId: org.id,
      metadata: { name: params.name, slug: params.slug },
    });

    return org;
  }

  /**
   * List all organisations (PLAT-03).
   */
  static async list(): Promise<Organisation[]> {
    return OrganisationRepository.findAll();
  }

  /**
   * Get organisation by slug.
   */
  static async getBySlug(slug: string): Promise<Organisation | null> {
    return OrganisationRepository.findBySlug(slug);
  }

  /**
   * Update an organisation.
   */
  static async update(
    id: string,
    params: { name?: string; slug?: string; status?: string },
    updatedByUserId?: string,
  ): Promise<Organisation> {
    // If slug is changing, validate uniqueness
    if (params.slug) {
      const existing = await OrganisationRepository.findBySlug(params.slug);
      if (existing && existing.id !== id) {
        throw new Error(`Organisation with slug "${params.slug}" already exists`);
      }
    }

    const org = await OrganisationRepository.update(id, params as any);

    await AuditLogService.log({
      userId: updatedByUserId,
      organisationId: id,
      action: AuditAction.UPDATE,
      entity: AuditEntity.ORGANISATION,
      entityId: id,
      metadata: { changes: params },
    });

    return org;
  }

  /**
   * Assign an admin to an organisation (PLAT-02).
   * Finds or creates user by email, assigns ORG_ADMIN role.
   * Supports multiple org admins.
   */
  static async assignAdmin(
    organisationId: string,
    userEmail: string,
    assignedByUserId?: string,
  ): Promise<void> {
    // Find or create the user
    let user = await UserRepository.findByEmail(userEmail);
    if (!user) {
      user = await UserRepository.create({ email: userEmail });
    }

    // Assign ORG_ADMIN role
    await UserService.assignRole(user.id, organisationId, UserRole.ORG_ADMIN, assignedByUserId);

    await AuditLogService.log({
      userId: assignedByUserId,
      organisationId,
      action: AuditAction.CREATE,
      entity: AuditEntity.ROLE,
      entityId: user.id,
      metadata: { role: UserRole.ORG_ADMIN, email: userEmail, action: "assign_admin" },
    });
  }

  /**
   * Remove an admin from an organisation.
   */
  static async removeAdmin(
    organisationId: string,
    userId: string,
    removedByUserId?: string,
  ): Promise<void> {
    await UserRoleRepository.delete(userId, organisationId, UserRole.ORG_ADMIN);

    await AuditLogService.log({
      userId: removedByUserId,
      organisationId,
      action: AuditAction.DELETE,
      entity: AuditEntity.ROLE,
      entityId: userId,
      metadata: { role: UserRole.ORG_ADMIN, action: "remove_admin" },
    });
  }

  /**
   * Get all admins for an organisation.
   * Returns users with ORG_ADMIN role for this org.
   */
  static async getAdmins(organisationId: string): Promise<User[]> {
    const users = await UserRepository.findByOrganisation(organisationId);
    // Filter to only those with ORG_ADMIN role
    const admins: User[] = [];
    for (const user of users) {
      const hasAdmin = await UserRoleRepository.hasRole(user.id, organisationId, UserRole.ORG_ADMIN);
      if (hasAdmin) {
        admins.push(user);
      }
    }
    return admins;
  }

  /**
   * Get dashboard statistics for an organisation (ORG-04).
   * Returns employee count, active absences (placeholder for Phase 1), department breakdown.
   */
  static async getDashboardStats(organisationId: string): Promise<OrgDashboardStats> {
    const stats: OrgStats = await OrganisationRepository.getStats(organisationId);
    const departments = await DepartmentRepository.findByOrganisation(organisationId);

    return {
      employeeCount: stats.employeeCount,
      activeEmployeeCount: stats.activeEmployeeCount,
      departmentCount: stats.departmentCount,
      activeAbsences: 0, // Placeholder for Phase 1 - absence tracking in Phase 2
      departments,
    };
  }

  /**
   * Update organisation settings (ORG-05).
   * Updates the settings JSONB field.
   */
  static async updateSettings(
    organisationId: string,
    settings: OrgSettings,
    updatedByUserId?: string,
  ): Promise<Organisation> {
    const org = await OrganisationRepository.update(organisationId, {
      settings: settings as unknown as Record<string, unknown>,
    });

    await AuditLogService.log({
      userId: updatedByUserId,
      organisationId,
      action: AuditAction.UPDATE,
      entity: AuditEntity.ORGANISATION,
      entityId: organisationId,
      metadata: { settingsUpdated: true, settings },
    });

    return org;
  }
}
