import { OhReferralRepository, OhReferralFilters } from "@/providers/repositories/oh-referral.repository";
import { SicknessCaseRepository } from "@/providers/repositories/sickness-case.repository";
import { EncryptionService } from "@/providers/services/encryption.service";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { TenantService } from "@/providers/services/tenant.service";
import { ReferralStatus, VALID_REFERRAL_TRANSITIONS } from "@/constants/referral-statuses";
import { createOhReferralSchema, CreateOhReferralInput } from "@/schemas/oh-referral";
import { OhReferral, OhReferralWithDetails, OhReferralCommunicationWithAuthor } from "@/types/database";
import { AuditAction, AuditEntity } from "@/types/enums";

/**
 * OhReferralService -- business logic for OH referral lifecycle.
 * Manages creation, status transitions, communication logging, and encryption.
 */
export class OhReferralService {
  /**
   * Create a new OH referral for a sickness case.
   * Validates sickness case exists and belongs to the organisation.
   * Derives employee_id from the sickness case.
   */
  static async create(
    data: CreateOhReferralInput,
    userId: string,
    organisationId: string,
  ): Promise<OhReferral> {
    const parsed = createOhReferralSchema.parse(data);

    const referral = await TenantService.withTenant(organisationId, false, async (client) => {
      // Validate sickness case exists and belongs to this organisation
      const sicknessCase = await SicknessCaseRepository.findById(parsed.sicknessCaseId, client);
      if (!sicknessCase || sicknessCase.organisationId !== organisationId) {
        throw new Error("Sickness case not found or does not belong to this organisation");
      }

      return OhReferralRepository.create(
        {
          organisationId,
          sicknessCaseId: parsed.sicknessCaseId,
          employeeId: sicknessCase.employeeId,
          providerId: parsed.providerId,
          referredBy: userId,
          reason: parsed.reason,
          urgency: parsed.urgency,
        },
        client,
      );
    });

    // Audit log
    await AuditLogService.log({
      userId,
      organisationId,
      action: AuditAction.REFER,
      entity: AuditEntity.OH_REFERRAL,
      entityId: referral.id,
      metadata: {
        sicknessCaseId: parsed.sicknessCaseId,
        providerId: parsed.providerId,
        urgency: parsed.urgency,
      },
    });

    return referral;
  }

  /**
   * Update the status of a referral with transition validation.
   * If transitioning to REPORT_RECEIVED, encrypts report notes.
   */
  static async updateStatus(
    referralId: string,
    newStatus: ReferralStatus,
    reportNotes: string | undefined,
    userId: string,
    organisationId: string,
  ): Promise<OhReferral> {
    const referral = await TenantService.withTenant(organisationId, false, async (client) => {
      const existing = await OhReferralRepository.findById(referralId, client);
      if (!existing || existing.organisationId !== organisationId) {
        throw new Error("Referral not found");
      }

      // Validate transition
      const currentStatus = existing.status as ReferralStatus;
      const validNextStates = VALID_REFERRAL_TRANSITIONS[currentStatus] || [];
      if (!validNextStates.includes(newStatus)) {
        throw new Error(
          `Invalid status transition from ${currentStatus} to ${newStatus}. Valid transitions: ${validNextStates.join(", ")}`,
        );
      }

      // Encrypt report notes if provided
      let reportNotesEncrypted: string | undefined;
      if (reportNotes && newStatus === ReferralStatus.REPORT_RECEIVED) {
        reportNotesEncrypted = EncryptionService.encryptField(reportNotes);
      }

      return OhReferralRepository.updateStatus(referralId, newStatus, reportNotesEncrypted, client);
    });

    // Audit log
    await AuditLogService.log({
      userId,
      organisationId,
      action: AuditAction.TRANSITION,
      entity: AuditEntity.OH_REFERRAL,
      entityId: referralId,
      metadata: { newStatus },
    });

    return referral;
  }

  /**
   * Add a communication record to a referral.
   */
  static async addCommunication(
    referralId: string,
    direction: string,
    message: string,
    userId: string,
    organisationId: string,
  ) {
    const communication = await TenantService.withTenant(organisationId, false, async (client) => {
      // Verify referral belongs to this org
      const existing = await OhReferralRepository.findById(referralId, client);
      if (!existing || existing.organisationId !== organisationId) {
        throw new Error("Referral not found");
      }

      return OhReferralRepository.addCommunication(
        {
          referralId,
          authorId: userId,
          direction,
          message,
        },
        client,
      );
    });

    // Audit log
    await AuditLogService.log({
      userId,
      organisationId,
      action: AuditAction.CREATE,
      entity: AuditEntity.OH_REFERRAL,
      entityId: referralId,
      metadata: { communicationId: communication.id, direction },
    });

    return communication;
  }

  /**
   * Get a referral by ID with communications and decrypted report notes.
   */
  static async getById(
    referralId: string,
    organisationId: string,
  ): Promise<{ referral: OhReferralWithDetails; communications: OhReferralCommunicationWithAuthor[] } | null> {
    return TenantService.withTenant(organisationId, false, async (client) => {
      const referral = await OhReferralRepository.findById(referralId, client);
      if (!referral || referral.organisationId !== organisationId) {
        return null;
      }

      const communications = await OhReferralRepository.getCommunications(referralId, client);

      // Decrypt report notes if present
      let decryptedNotes: string | undefined;
      if (referral.reportNotesEncrypted) {
        try {
          decryptedNotes = EncryptionService.decryptField(referral.reportNotesEncrypted);
        } catch {
          decryptedNotes = undefined;
        }
      }

      return {
        referral: {
          ...referral,
          reportNotesEncrypted: decryptedNotes || referral.reportNotesEncrypted,
        },
        communications,
      };
    });
  }

  /**
   * List referrals for an organisation with optional filters.
   */
  static async listByOrganisation(
    organisationId: string,
    filters?: OhReferralFilters,
  ): Promise<OhReferralWithDetails[]> {
    return TenantService.withTenant(organisationId, false, async (client) => {
      return OhReferralRepository.findByOrganisation(organisationId, filters, client);
    });
  }
}
