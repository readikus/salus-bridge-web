import { EmployeeRepository } from "@/providers/repositories/employee.repository";
import { UserRepository } from "@/providers/repositories/user.repository";
import { UserRoleRepository } from "@/providers/repositories/user-role.repository";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { TenantService } from "@/providers/services/tenant.service";
import {
  Employee,
  EmployeeWithDetails,
  CreateEmployeeParams,
  UpdateEmployeeParams,
  EmployeeFilters,
  DataSubjectRecord,
} from "@/types/database";
import { UserRole, AuditAction, AuditEntity, EmployeeStatus } from "@/types/enums";

export class EmployeeService {
  /**
   * List employees for an organisation with optional filters.
   * Uses TenantService.withTenant() for RLS context.
   */
  static async list(
    organisationId: string,
    filters?: EmployeeFilters,
  ): Promise<EmployeeWithDetails[]> {
    return TenantService.withTenant(organisationId, false, async (client) => {
      return EmployeeRepository.findByOrganisation(organisationId, filters, client);
    });
  }

  /**
   * List employees visible to a manager (full reporting chain).
   * Per CONTEXT.md: "Manager scope includes full reporting chain".
   */
  static async listForManager(
    managerId: string,
    organisationId: string,
  ): Promise<EmployeeWithDetails[]> {
    return TenantService.withTenant(organisationId, false, async (client) => {
      return EmployeeRepository.findByManagerChain(managerId, organisationId, client);
    });
  }

  /**
   * Get a single employee by ID with details.
   */
  static async getById(
    id: string,
    organisationId: string,
  ): Promise<EmployeeWithDetails | null> {
    return TenantService.withTenant(organisationId, false, async (client) => {
      const employee = await EmployeeRepository.findByIdWithDetails(id, client);
      if (employee && employee.organisationId !== organisationId) {
        return null;
      }
      return employee;
    });
  }

  /**
   * Create a new employee.
   * Creates a user record first, then the employee record.
   * Does NOT auto-invite (per user decision -- admin triggers manually).
   */
  static async create(
    params: CreateEmployeeParams,
    organisationId: string,
    actorId?: string,
  ): Promise<EmployeeWithDetails> {
    // Check for duplicate email within the org
    const existing = await EmployeeRepository.findByEmail(params.email, organisationId);
    if (existing) {
      throw new Error("An employee with this email already exists in this organisation");
    }

    // Find or create user record
    let user = await UserRepository.findByEmail(params.email);
    if (!user) {
      user = await UserRepository.create({
        email: params.email,
        firstName: params.firstName,
        lastName: params.lastName,
      });
    } else {
      // Update name if not set
      if (!user.firstName || !user.lastName) {
        user = await UserRepository.update(user.id, {
          firstName: params.firstName || user.firstName,
          lastName: params.lastName || user.lastName,
        });
      }
    }

    // Create employee record
    const employee = await EmployeeRepository.create({
      ...params,
      organisationId,
    });

    // Link user to employee
    await EmployeeRepository.linkUser(employee.id, user.id);

    // Assign EMPLOYEE role
    await UserRoleRepository.create({
      userId: user.id,
      organisationId,
      role: UserRole.EMPLOYEE,
    });

    // Audit log
    await AuditLogService.log({
      userId: actorId,
      organisationId,
      action: AuditAction.CREATE,
      entity: AuditEntity.EMPLOYEE,
      entityId: employee.id,
      metadata: {
        email: params.email,
        firstName: params.firstName,
        lastName: params.lastName,
        jobTitle: params.jobTitle,
      },
    });

    // Return with details
    const result = await EmployeeRepository.findByIdWithDetails(employee.id);
    return result!;
  }

  /**
   * Update an employee record.
   */
  static async update(
    id: string,
    params: UpdateEmployeeParams,
    organisationId: string,
    actorId?: string,
  ): Promise<EmployeeWithDetails> {
    const employee = await EmployeeRepository.findById(id);
    if (!employee || employee.organisationId !== organisationId) {
      throw new Error("Employee not found");
    }

    // Update user record if name/email changed
    if (employee.userId && (params.firstName || params.lastName || params.email)) {
      const userUpdates: Record<string, string | undefined> = {};
      if (params.firstName !== undefined) userUpdates.firstName = params.firstName;
      if (params.lastName !== undefined) userUpdates.lastName = params.lastName;
      if (params.email !== undefined) userUpdates.email = params.email;
      if (Object.keys(userUpdates).length > 0) {
        await UserRepository.update(employee.userId, userUpdates);
      }
    }

    // Update employee record (only employee-specific fields)
    const employeeUpdates: UpdateEmployeeParams = {};
    if (params.jobTitle !== undefined) employeeUpdates.jobTitle = params.jobTitle;
    if (params.departmentId !== undefined) employeeUpdates.departmentId = params.departmentId;
    if (params.managerId !== undefined) employeeUpdates.managerId = params.managerId;
    if (params.status !== undefined) employeeUpdates.status = params.status;

    if (Object.keys(employeeUpdates).length > 0) {
      await EmployeeRepository.update(id, employeeUpdates);
    }

    // Audit log
    await AuditLogService.log({
      userId: actorId,
      organisationId,
      action: AuditAction.UPDATE,
      entity: AuditEntity.EMPLOYEE,
      entityId: id,
      metadata: { changes: params },
    });

    const result = await EmployeeRepository.findByIdWithDetails(id);
    return result!;
  }

  /**
   * Deactivate an employee (soft delete).
   * Also deactivates the linked user account.
   */
  static async deactivate(
    id: string,
    organisationId: string,
    actorId?: string,
  ): Promise<void> {
    const employee = await EmployeeRepository.findById(id);
    if (!employee || employee.organisationId !== organisationId) {
      throw new Error("Employee not found");
    }

    await EmployeeRepository.deactivate(id);

    // Deactivate the linked user
    if (employee.userId) {
      await UserRepository.update(employee.userId, { isActive: false });
    }

    // Audit log
    await AuditLogService.log({
      userId: actorId,
      organisationId,
      action: AuditAction.DELETE,
      entity: AuditEntity.EMPLOYEE,
      entityId: id,
      metadata: { event: "employee_deactivated" },
    });
  }

  /**
   * Assign a role to an employee's user account (ORG-03).
   */
  static async assignRole(
    employeeId: string,
    role: UserRole,
    organisationId: string,
    actorId?: string,
  ): Promise<void> {
    const employee = await EmployeeRepository.findById(employeeId);
    if (!employee || employee.organisationId !== organisationId) {
      throw new Error("Employee not found");
    }
    if (!employee.userId) {
      throw new Error("Employee has no linked user account");
    }

    await UserRoleRepository.create({
      userId: employee.userId,
      organisationId,
      role,
    });

    await AuditLogService.log({
      userId: actorId,
      organisationId,
      action: AuditAction.CREATE,
      entity: AuditEntity.ROLE,
      entityId: employeeId,
      metadata: { role, assignedToUserId: employee.userId },
    });
  }

  /**
   * Remove a role from an employee's user account.
   */
  static async removeRole(
    employeeId: string,
    role: UserRole,
    organisationId: string,
    actorId?: string,
  ): Promise<void> {
    const employee = await EmployeeRepository.findById(employeeId);
    if (!employee || employee.organisationId !== organisationId) {
      throw new Error("Employee not found");
    }
    if (!employee.userId) {
      throw new Error("Employee has no linked user account");
    }

    await UserRoleRepository.delete(employee.userId, organisationId, role);

    await AuditLogService.log({
      userId: actorId,
      organisationId,
      action: AuditAction.DELETE,
      entity: AuditEntity.ROLE,
      entityId: employeeId,
      metadata: { role, removedFromUserId: employee.userId },
    });
  }

  /**
   * Get the roles assigned to an employee's user.
   */
  static async getRoles(
    employeeId: string,
    organisationId: string,
  ): Promise<UserRole[]> {
    const employee = await EmployeeRepository.findById(employeeId);
    if (!employee || employee.organisationId !== organisationId || !employee.userId) {
      return [];
    }

    const roles = await UserRoleRepository.findByUserAndOrg(employee.userId, organisationId);
    return roles.map((r) => r.role);
  }

  /**
   * Get all employees in a manager's reporting chain (AUTH-06).
   * Uses recursive CTE for full hierarchy (direct reports + their reports).
   */
  static async getTeamForManager(
    managerId: string,
    organisationId: string,
  ): Promise<EmployeeWithDetails[]> {
    return TenantService.withTenant(organisationId, false, async (client) => {
      return EmployeeRepository.findByManagerChain(managerId, organisationId, client);
    });
  }

  /**
   * Get all data held about an employee -- SAR readiness (COMP-05).
   */
  static async getMyData(employeeId: string): Promise<DataSubjectRecord | null> {
    return EmployeeRepository.getDataSubjectRecord(employeeId);
  }
}
