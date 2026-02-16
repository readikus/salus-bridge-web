import { SicknessCaseRepository, SicknessCaseFilters } from "@/providers/repositories/sickness-case.repository";
import { CaseTransitionRepository } from "@/providers/repositories/case-transition.repository";
import { EmployeeRepository } from "@/providers/repositories/employee.repository";
import { OrganisationRepository } from "@/providers/repositories/organisation.repository";
import { EncryptionService } from "@/providers/services/encryption.service";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { NotificationService } from "@/providers/services/notification.service";
import { TriggerService } from "@/providers/services/trigger.service";
import { TenantService } from "@/providers/services/tenant.service";
import { WorkingDaysService } from "@/providers/services/working-days.service";
import { createSicknessCaseSchema, CreateSicknessCaseInput } from "@/schemas/sickness-case";
import { SicknessCase, CaseTransition } from "@/types/database";
import { AuditAction, AuditEntity } from "@/types/enums";

/**
 * SicknessCaseService -- business logic for sickness case CRUD.
 * Does NOT handle state transitions (that's WorkflowService).
 */
export class SicknessCaseService {
  /**
   * Create a new sickness case.
   * Validates input, encrypts notes if provided, calculates working days if end date given.
   */
  static async create(
    data: CreateSicknessCaseInput,
    userId: string,
    organisationId: string,
  ): Promise<SicknessCase> {
    // Validate input
    const parsed = createSicknessCaseSchema.parse(data);

    // Encrypt notes if provided
    const notesEncrypted = parsed.notes ? EncryptionService.encryptField(parsed.notes) : undefined;

    // Create case within tenant context
    const sicknessCase = await TenantService.withTenant(organisationId, false, async (client) => {
      const created = await SicknessCaseRepository.create(
        {
          organisationId,
          employeeId: parsed.employeeId,
          reportedBy: userId,
          absenceType: parsed.absenceType,
          absenceStartDate: parsed.absenceStartDate,
          absenceEndDate: parsed.absenceEndDate,
          notesEncrypted,
        },
        client,
      );

      // If end date provided, calculate working days
      if (parsed.absenceEndDate) {
        const workingDays = await WorkingDaysService.calculateWorkingDaysLost(
          parsed.absenceStartDate,
          parsed.absenceEndDate,
        );
        return SicknessCaseRepository.updateEndDate(created.id, parsed.absenceEndDate, workingDays, client);
      }

      return created;
    });

    // Log audit
    await AuditLogService.log({
      userId,
      organisationId,
      action: AuditAction.CREATE,
      entity: AuditEntity.SICKNESS_CASE,
      entityId: sicknessCase.id,
      metadata: {
        employeeId: parsed.employeeId,
        absenceType: parsed.absenceType,
        absenceStartDate: parsed.absenceStartDate,
        absenceEndDate: parsed.absenceEndDate,
      },
    });

    // Fire-and-forget: notify manager when sickness is reported (NOTF-01)
    try {
      const managerInfo = await EmployeeRepository.getManagerInfo(parsed.employeeId);
      if (managerInfo) {
        const org = await OrganisationRepository.findById(organisationId);
        const orgName = org?.name || "Your Organisation";
        await NotificationService.notifySicknessReported(
          { id: sicknessCase.id, absenceStartDate: parsed.absenceStartDate },
          { email: managerInfo.email, userId: managerInfo.userId },
          orgName,
          organisationId,
        );
      }
    } catch (notifError) {
      console.error("[SicknessCaseService] Failed to send sickness reported notification:", notifError);
    }

    // Fire-and-forget: evaluate trigger rules on case creation
    try {
      await TriggerService.evaluate(parsed.employeeId, organisationId, sicknessCase.id);
    } catch (triggerError) {
      console.error("[TriggerService] evaluation failed:", triggerError);
    }

    return sicknessCase;
  }

  /**
   * Get a sickness case by ID with decrypted notes.
   */
  static async getById(
    id: string,
    organisationId: string,
  ): Promise<(SicknessCase & { notes?: string }) | null> {
    const sicknessCase = await TenantService.withTenant(organisationId, false, async (client) => {
      return SicknessCaseRepository.findById(id, client);
    });

    if (!sicknessCase || sicknessCase.organisationId !== organisationId) {
      return null;
    }

    // Decrypt notes if present
    const notes = sicknessCase.notesEncrypted
      ? EncryptionService.decryptField(sicknessCase.notesEncrypted)
      : undefined;

    return { ...sicknessCase, notes };
  }

  /**
   * Get all sickness cases for an organisation with optional filters.
   */
  static async getForOrganisation(
    organisationId: string,
    filters?: SicknessCaseFilters,
  ): Promise<SicknessCase[]> {
    return TenantService.withTenant(organisationId, false, async (client) => {
      return SicknessCaseRepository.findByOrganisation(organisationId, filters, client);
    });
  }

  /**
   * Get all sickness cases for a specific employee.
   */
  static async getForEmployee(employeeId: string, organisationId: string): Promise<SicknessCase[]> {
    return TenantService.withTenant(organisationId, false, async (client) => {
      return SicknessCaseRepository.findByEmployee(employeeId, client);
    });
  }

  /**
   * Get all sickness cases for a manager's reporting chain.
   */
  static async getForManagerTeam(managerId: string, organisationId: string): Promise<SicknessCase[]> {
    return TenantService.withTenant(organisationId, false, async (client) => {
      return SicknessCaseRepository.findByManagerTeam(managerId, organisationId, client);
    });
  }

  /**
   * Update the end date for a sickness case.
   * Recalculates working days lost.
   */
  static async updateEndDate(
    id: string,
    endDate: string,
    organisationId: string,
    userId: string,
  ): Promise<SicknessCase> {
    const sicknessCase = await TenantService.withTenant(organisationId, false, async (client) => {
      const existing = await SicknessCaseRepository.findById(id, client);
      if (!existing || existing.organisationId !== organisationId) {
        throw new Error("Sickness case not found");
      }

      const workingDays = await WorkingDaysService.calculateWorkingDaysLost(
        existing.absenceStartDate,
        endDate,
      );

      return SicknessCaseRepository.updateEndDate(id, endDate, workingDays, client);
    });

    // Log audit
    await AuditLogService.log({
      userId,
      organisationId,
      action: AuditAction.UPDATE,
      entity: AuditEntity.SICKNESS_CASE,
      entityId: id,
      metadata: { endDate, workingDaysLost: sicknessCase.workingDaysLost },
    });

    return sicknessCase;
  }

  /**
   * Get transitions for a sickness case (chronological timeline).
   */
  static async getTransitions(caseId: string): Promise<CaseTransition[]> {
    return CaseTransitionRepository.findByCaseId(caseId);
  }
}
