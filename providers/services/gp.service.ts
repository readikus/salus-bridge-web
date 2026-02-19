import { EmployeeRepository } from "@/providers/repositories/employee.repository";
import { MedicalConsentRepository } from "@/providers/repositories/medical-consent.repository";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { MedicalRecordsConsent } from "@/types/database";
import { GpDetailsInput } from "@/schemas/gp-details";
import { AuditAction, AuditEntity } from "@/types/enums";
import { PoolClient } from "pg";

/**
 * GpService -- business logic for GP details and medical records consent.
 */
export class GpService {
  /**
   * Update GP details for an employee.
   * Only the employee themselves (matched via userId on employee record) can update.
   */
  static async updateGpDetails(
    employeeId: string,
    data: GpDetailsInput,
    userId: string,
    organisationId: string,
    client?: PoolClient,
  ): Promise<void> {
    await EmployeeRepository.updateGpDetails(employeeId, data, client);

    await AuditLogService.log({
      userId,
      organisationId,
      action: AuditAction.UPDATE,
      entity: AuditEntity.GP_DETAILS,
      entityId: employeeId,
      metadata: { fields: Object.keys(data).filter((k) => data[k as keyof GpDetailsInput] !== undefined) },
    });
  }

  /**
   * Grant medical records consent for an employee.
   * Creates or updates the consent record with status GRANTED.
   */
  static async grantConsent(
    employeeId: string,
    userId: string,
    organisationId: string,
    notes?: string,
    client?: PoolClient,
  ): Promise<MedicalRecordsConsent> {
    const consent = await MedicalConsentRepository.upsert(
      {
        organisationId,
        employeeId,
        consentedBy: userId,
        consentStatus: "GRANTED",
        notes,
      },
      client,
    );

    await AuditLogService.log({
      userId,
      organisationId,
      action: AuditAction.CONSENT,
      entity: AuditEntity.MEDICAL_CONSENT,
      entityId: consent.id,
      metadata: { employeeId, status: "GRANTED" },
    });

    return consent;
  }

  /**
   * Revoke medical records consent.
   */
  static async revokeConsent(
    employeeId: string,
    userId: string,
    organisationId: string,
    notes?: string,
    client?: PoolClient,
  ): Promise<MedicalRecordsConsent> {
    const consent = await MedicalConsentRepository.upsert(
      {
        organisationId,
        employeeId,
        consentedBy: userId,
        consentStatus: "REVOKED",
        notes,
      },
      client,
    );

    await AuditLogService.log({
      userId,
      organisationId,
      action: AuditAction.REVOKE,
      entity: AuditEntity.MEDICAL_CONSENT,
      entityId: consent.id,
      metadata: { employeeId, status: "REVOKED" },
    });

    return consent;
  }
}
