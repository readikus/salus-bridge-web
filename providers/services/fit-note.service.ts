import { FitNoteRepository, ExpiringFitNote } from "@/providers/repositories/fit-note.repository";
import { SicknessCaseRepository } from "@/providers/repositories/sickness-case.repository";
import { StorageService } from "@/providers/services/storage.service";
import { EncryptionService } from "@/providers/services/encryption.service";
import { WorkflowService } from "@/providers/services/workflow.service";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { TenantService } from "@/providers/services/tenant.service";
import { SicknessAction } from "@/constants/sickness-states";
import { AuditAction, AuditEntity, UserRole } from "@/types/enums";
import { UserRoleWithOrg } from "@/types/auth";
import { FitNote } from "@/types/database";
import { CreateFitNoteInput } from "@/schemas/fit-note";

/**
 * FitNoteService handles fit note business logic with access control.
 * FIT-04: Managers are explicitly blocked from accessing fit note documents.
 * Only EMPLOYEE (own case), HR, and ORG_ADMIN can view/download fit notes.
 */
export class FitNoteService {
  /**
   * Upload a fit note document and create metadata record.
   * Triggers RECEIVE_FIT_NOTE state transition on the sickness case.
   */
  static async upload(
    caseId: string,
    file: { buffer: Buffer; name: string; contentType: string; size: number },
    metadata: CreateFitNoteInput,
    userId: string,
    organisationId: string,
  ): Promise<FitNote> {
    // Upload file to Supabase Storage (validates content type and size)
    const storagePath = await StorageService.upload(organisationId, caseId, file.name, file.buffer, file.contentType);

    try {
      // Encrypt notes if provided
      const notesEncrypted = metadata.notes ? EncryptionService.encryptField(metadata.notes) : undefined;

      // Get the case to find the employee ID
      const sicknessCase = await TenantService.withTenant(organisationId, false, async (client) => {
        return SicknessCaseRepository.findById(caseId, client);
      });

      if (!sicknessCase) {
        throw new Error("Sickness case not found");
      }

      // Create fit note record within tenant context
      const fitNote = await TenantService.withTenant(organisationId, false, async (client) => {
        return FitNoteRepository.create(
          {
            organisationId,
            sicknessCaseId: caseId,
            employeeId: sicknessCase.employeeId,
            uploadedBy: userId,
            storagePath,
            fileName: file.name,
            fileSizeBytes: file.size,
            contentType: file.contentType,
            fitNoteStatus: metadata.fitNoteStatus,
            startDate: metadata.startDate,
            endDate: metadata.endDate,
            functionalEffects: metadata.functionalEffects,
            notesEncrypted,
          },
          client,
        );
      });

      // Trigger state transition to FIT_NOTE_RECEIVED
      await WorkflowService.transition(caseId, SicknessAction.RECEIVE_FIT_NOTE, userId, organisationId);

      // Log audit
      await AuditLogService.log({
        userId,
        organisationId,
        action: AuditAction.UPLOAD,
        entity: AuditEntity.FIT_NOTE,
        entityId: fitNote.id,
        metadata: {
          caseId,
          fileName: file.name,
          fitNoteStatus: metadata.fitNoteStatus,
          startDate: metadata.startDate,
          endDate: metadata.endDate || null,
        },
      });

      return fitNote;
    } catch (error) {
      // Clean up uploaded file if record creation fails
      await StorageService.delete(storagePath).catch(() => {
        // Ignore cleanup errors
      });
      throw error;
    }
  }

  /**
   * Get fit notes for a sickness case with role-based access control.
   * FIT-04: MANAGERS CANNOT access fit notes. Only EMPLOYEE (own case), HR, ORG_ADMIN.
   */
  static async getForCase(
    caseId: string,
    userId: string,
    organisationId: string,
    userRoles: UserRoleWithOrg[],
    employeeId?: string,
  ): Promise<FitNote[]> {
    FitNoteService.assertNotManager(userRoles, organisationId);

    // If user is an employee, verify the case belongs to them
    const isHrOrAdmin = FitNoteService.isHrOrAdmin(userRoles, organisationId);
    if (!isHrOrAdmin && employeeId) {
      const sicknessCase = await TenantService.withTenant(organisationId, false, async (client) => {
        return SicknessCaseRepository.findById(caseId, client);
      });

      if (!sicknessCase || sicknessCase.employeeId !== employeeId) {
        throw new Error("You can only view fit notes for your own sickness cases");
      }
    }

    return TenantService.withTenant(organisationId, false, async (client) => {
      return FitNoteRepository.findByCaseId(caseId, client);
    });
  }

  /**
   * Generate a signed download URL for a fit note document.
   * FIT-04: MANAGERS CANNOT download fit notes.
   */
  static async getSignedDownloadUrl(
    fitNoteId: string,
    userId: string,
    organisationId: string,
    userRoles: UserRoleWithOrg[],
    employeeId?: string,
  ): Promise<string> {
    FitNoteService.assertNotManager(userRoles, organisationId);

    const fitNote = await TenantService.withTenant(organisationId, false, async (client) => {
      return FitNoteRepository.findById(fitNoteId, client);
    });

    if (!fitNote) {
      throw new Error("Fit note not found");
    }

    // If employee, verify ownership
    const isHrOrAdmin = FitNoteService.isHrOrAdmin(userRoles, organisationId);
    if (!isHrOrAdmin && employeeId && fitNote.employeeId !== employeeId) {
      throw new Error("You can only download fit notes for your own sickness cases");
    }

    const signedUrl = await StorageService.getSignedUrl(fitNote.storagePath);

    // Log audit
    await AuditLogService.log({
      userId,
      organisationId,
      action: AuditAction.DOWNLOAD,
      entity: AuditEntity.FIT_NOTE,
      entityId: fitNoteId,
      metadata: {
        fileName: fitNote.fileName,
        caseId: fitNote.sicknessCaseId,
      },
    });

    return signedUrl;
  }

  /**
   * Get fit notes expiring within a given number of days. Used by cron endpoint.
   */
  static async getExpiringFitNotes(days: number): Promise<ExpiringFitNote[]> {
    return FitNoteRepository.findExpiringWithinDays(days);
  }

  /**
   * FIT-04 enforcement: Reject access for users with only MANAGER role in the org.
   * Managers must NOT have access to fit note documents.
   */
  private static assertNotManager(userRoles: UserRoleWithOrg[], organisationId: string): void {
    const orgRoles = userRoles.filter((r) => r.organisationId === organisationId);
    const hasOnlyManagerRole =
      orgRoles.length > 0 && orgRoles.every((r) => r.role === UserRole.MANAGER || r.role === UserRole.EMPLOYEE);
    const hasManagerRole = orgRoles.some((r) => r.role === UserRole.MANAGER);
    const hasElevatedRole = orgRoles.some(
      (r) => r.role === UserRole.HR || r.role === UserRole.ORG_ADMIN || r.role === UserRole.PLATFORM_ADMIN,
    );

    if (hasManagerRole && !hasElevatedRole) {
      throw new Error("Managers do not have access to fit note documents");
    }
  }

  /**
   * Check if the user has HR or ORG_ADMIN role for the organisation.
   */
  private static isHrOrAdmin(userRoles: UserRoleWithOrg[], organisationId: string): boolean {
    return userRoles.some(
      (r) =>
        r.organisationId === organisationId &&
        (r.role === UserRole.HR || r.role === UserRole.ORG_ADMIN || r.role === UserRole.PLATFORM_ADMIN),
    );
  }
}
