import { GuidanceRepository } from "@/providers/repositories/guidance.repository";
import { SicknessCaseRepository } from "@/providers/repositories/sickness-case.repository";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { TenantService } from "@/providers/services/tenant.service";
import { GUIDANCE_SCRIPTS, GuidanceScript } from "@/constants/guidance-content";
import { SicknessState } from "@/constants/sickness-states";
import { AuditAction, AuditEntity } from "@/types/enums";

/**
 * GuidanceService -- retrieves context-appropriate manager guidance and tracks engagement.
 * Determines the right guidance script based on case state and absence type.
 */
export class GuidanceService {
  /**
   * Get the appropriate guidance script for a sickness case.
   * Matches by case state (determines guidance type) and absence type (determines specific content).
   * Falls back to 'general' absence type if no specific match exists.
   *
   * @returns The matched script and an array of already-engaged step IDs for this user.
   */
  static async getGuidanceForCase(
    caseId: string,
    organisationId: string,
    userId: string,
  ): Promise<{ script: GuidanceScript | null; engagedSteps: string[] }> {
    // Fetch the sickness case to determine absence type and current state
    const sicknessCase = await TenantService.withTenant(organisationId, false, async (client) => {
      return SicknessCaseRepository.findById(caseId, client);
    });

    if (!sicknessCase || sicknessCase.organisationId !== organisationId) {
      throw new Error("Sickness case not found");
    }

    // Determine guidance type based on current state
    const guidanceType = GuidanceService.getGuidanceTypeForState(sicknessCase.status as SicknessState);

    // Find matching script: try specific absence type first, then fall back to general
    const absenceType = sicknessCase.absenceType;
    let script = GUIDANCE_SCRIPTS.find((s) => s.type === guidanceType && s.absenceType === absenceType) || null;

    if (!script) {
      script = GUIDANCE_SCRIPTS.find((s) => s.type === guidanceType && s.absenceType === "general") || null;
    }

    // Fetch engagement records for this user + case
    const engagements = await TenantService.withTenant(organisationId, false, async (client) => {
      return GuidanceRepository.findEngagementByCaseAndUser(caseId, userId, client);
    });

    const engagedSteps = engagements.map((e) => e.guidanceStep);

    return { script, engagedSteps };
  }

  /**
   * Track that a manager has engaged with a specific guidance step.
   */
  static async trackEngagement(
    caseId: string,
    userId: string,
    organisationId: string,
    guidanceType: string,
    guidanceStep: string,
  ): Promise<void> {
    await TenantService.withTenant(organisationId, false, async (client) => {
      return GuidanceRepository.createEngagement(
        {
          organisationId,
          sicknessCaseId: caseId,
          userId,
          guidanceType,
          guidanceStep,
        },
        client,
      );
    });

    // Log audit
    await AuditLogService.log({
      userId,
      organisationId,
      action: AuditAction.VIEW,
      entity: AuditEntity.GUIDANCE,
      entityId: caseId,
      metadata: {
        guidanceType,
        guidanceStep,
      },
    });
  }

  /**
   * Map sickness case state to guidance type.
   */
  private static getGuidanceTypeForState(state: SicknessState): "initial_contact" | "check_in" | "rtw_meeting" {
    switch (state) {
      case SicknessState.REPORTED:
      case SicknessState.TRACKING:
        return "initial_contact";
      case SicknessState.FIT_NOTE_RECEIVED:
        return "check_in";
      case SicknessState.RTW_SCHEDULED:
      case SicknessState.RTW_COMPLETED:
        return "rtw_meeting";
      default:
        return "initial_contact";
    }
  }
}
