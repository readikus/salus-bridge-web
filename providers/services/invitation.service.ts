import { randomUUID } from "crypto";
import { EmployeeRepository } from "@/providers/repositories/employee.repository";
import { UserService } from "@/providers/services/user.service";
import { UserRepository } from "@/providers/repositories/user.repository";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { Employee } from "@/types/database";
import { UserRole, AuditAction, AuditEntity, EmployeeStatus } from "@/types/enums";

const INVITATION_EXPIRY_DAYS = 7;

export class InvitationService {
  /**
   * Create an invitation for an employee.
   * Generates a unique token and sets a 7-day expiry (per user decision).
   */
  static async createInvitation(
    employeeId: string,
    organisationId: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    await EmployeeRepository.setInvitationToken(employeeId, token, expiresAt);

    return { token, expiresAt };
  }

  /**
   * Validate an invitation token.
   * Checks existence, expiry, and whether already accepted.
   */
  static async validateToken(token: string): Promise<{
    valid: boolean;
    employee?: Employee;
    expired?: boolean;
  }> {
    const employee = await EmployeeRepository.findByInvitationToken(token);

    if (!employee) {
      return { valid: false };
    }

    // Check if already accepted
    if (employee.status === EmployeeStatus.ACTIVE) {
      return { valid: false, employee };
    }

    // Check expiry
    if (employee.invitationExpiresAt && new Date() > new Date(employee.invitationExpiresAt)) {
      return { valid: false, employee, expired: true };
    }

    return { valid: true, employee };
  }

  /**
   * Accept an invitation: link user, assign EMPLOYEE role, mark as active.
   * Per user decision: click magic link -> set password -> straight to dashboard.
   */
  static async acceptInvitation(
    token: string,
    supabaseAuthId: string,
    userId: string,
  ): Promise<void> {
    const { valid, employee } = await this.validateToken(token);
    if (!valid || !employee) {
      throw new Error("Invalid or expired invitation token");
    }

    // Link employee to user account
    await EmployeeRepository.linkUser(employee.id, userId);

    // Mark as active and clear token (single-use)
    await EmployeeRepository.updateInvitationStatus(employee.id, EmployeeStatus.ACTIVE);
    await EmployeeRepository.clearInvitationToken(employee.id);

    // Assign EMPLOYEE role for the organisation
    await UserService.assignRole(userId, employee.organisationId, UserRole.EMPLOYEE);

    // Audit log
    await AuditLogService.log({
      userId,
      organisationId: employee.organisationId,
      action: AuditAction.UPDATE,
      entity: AuditEntity.EMPLOYEE,
      entityId: employee.id,
      metadata: { event: "invitation_accepted", supabaseAuthId },
    });
  }

  /**
   * Resend an invitation: generate a new token and reset expiry.
   * Per user decision: admin can resend if expired.
   */
  static async resendInvitation(
    employeeId: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    const employee = await EmployeeRepository.findById(employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }

    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    await EmployeeRepository.setInvitationToken(employeeId, token, expiresAt);

    return { token, expiresAt };
  }
}
