import { SicknessState, SicknessAction, VALID_TRANSITIONS } from "@/constants/sickness-states";
import { SicknessCaseRepository } from "@/providers/repositories/sickness-case.repository";
import { CaseTransitionRepository } from "@/providers/repositories/case-transition.repository";
import { OrganisationRepository } from "@/providers/repositories/organisation.repository";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { TenantService } from "@/providers/services/tenant.service";
import { WorkingDaysService } from "@/providers/services/working-days.service";
import { OrgSettingsSchema } from "@/schemas/organisation";
import { SicknessCase } from "@/types/database";
import { AuditAction, AuditEntity } from "@/types/enums";

/**
 * WorkflowService is the single entry point for all sickness case state changes.
 * Validates transitions against VALID_TRANSITIONS, creates transition records,
 * and handles side effects (long-term flag, audit logging).
 */
export class WorkflowService {
  /**
   * Execute a state transition on a sickness case.
   * Wraps in TenantService.withTenant() for RLS context.
   *
   * @param caseId - The sickness case to transition
   * @param action - The action to perform (from SicknessAction enum)
   * @param userId - The user performing the action
   * @param organisationId - The organisation context
   * @param notes - Optional notes for the transition
   * @returns The updated sickness case
   * @throws Error if transition is invalid
   */
  static async transition(
    caseId: string,
    action: SicknessAction,
    userId: string,
    organisationId: string,
    notes?: string,
  ): Promise<SicknessCase> {
    return TenantService.withTenant(organisationId, false, async (client) => {
      // Fetch current case
      const currentCase = await SicknessCaseRepository.findById(caseId, client);
      if (!currentCase) {
        throw new Error("Sickness case not found");
      }

      if (currentCase.organisationId !== organisationId) {
        throw new Error("Sickness case not found");
      }

      // Validate transition
      const currentState = currentCase.status as SicknessState;
      const stateTransitions = VALID_TRANSITIONS[currentState];
      if (!stateTransitions || !(action in stateTransitions)) {
        throw new Error(
          `Invalid transition: cannot perform '${action}' when case is in '${currentState}' state`,
        );
      }

      const newStatus = stateTransitions[action]!;

      // Update case status
      const updatedCase = await SicknessCaseRepository.updateStatus(caseId, newStatus, client);

      // Create transition record
      await CaseTransitionRepository.create(
        {
          sicknessCaseId: caseId,
          fromStatus: currentState,
          toStatus: newStatus,
          action,
          performedBy: userId,
          notes,
        },
        client,
      );

      // Log audit
      await AuditLogService.log({
        userId,
        organisationId,
        action: AuditAction.TRANSITION,
        entity: AuditEntity.SICKNESS_CASE,
        entityId: caseId,
        metadata: {
          fromStatus: currentState,
          toStatus: newStatus,
          action,
          notes: notes ? "(provided)" : undefined,
        },
      });

      // Check long-term threshold (WRKF-04)
      await WorkflowService.checkLongTermThreshold(updatedCase, organisationId, client);

      return updatedCase;
    });
  }

  /**
   * Get available actions for a given case status.
   * Derives valid actions from VALID_TRANSITIONS map.
   */
  static getAvailableActions(caseStatus: SicknessState): SicknessAction[] {
    const transitions = VALID_TRANSITIONS[caseStatus];
    if (!transitions) return [];
    return Object.keys(transitions) as SicknessAction[];
  }

  /**
   * Check if a case should be flagged as long-term based on org settings.
   * Fetches the organisation's longTermDays threshold and compares against working days lost.
   */
  private static async checkLongTermThreshold(
    sicknessCase: SicknessCase,
    organisationId: string,
    client: import("pg").PoolClient,
  ): Promise<void> {
    // Only check if we have an end date to calculate against
    if (!sicknessCase.absenceEndDate) {
      // For ongoing cases, check calendar days from start
      const startDate = new Date(sicknessCase.absenceStartDate);
      const now = new Date();
      const calendarDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      const org = await OrganisationRepository.findById(organisationId);
      if (!org) return;

      const settings = OrgSettingsSchema.parse(org.settings || {});
      const longTermDays = settings.absenceTriggerThresholds.longTermDays;

      const shouldBeLongTerm = calendarDays >= longTermDays;
      if (shouldBeLongTerm !== sicknessCase.isLongTerm) {
        await SicknessCaseRepository.updateLongTermFlag(sicknessCase.id, shouldBeLongTerm, client);
      }
      return;
    }

    // If we have working days lost, use that
    if (sicknessCase.workingDaysLost !== null) {
      const org = await OrganisationRepository.findById(organisationId);
      if (!org) return;

      const settings = OrgSettingsSchema.parse(org.settings || {});
      const longTermDays = settings.absenceTriggerThresholds.longTermDays;

      const shouldBeLongTerm = sicknessCase.workingDaysLost >= longTermDays;
      if (shouldBeLongTerm !== sicknessCase.isLongTerm) {
        await SicknessCaseRepository.updateLongTermFlag(sicknessCase.id, shouldBeLongTerm, client);
      }
    }
  }
}
