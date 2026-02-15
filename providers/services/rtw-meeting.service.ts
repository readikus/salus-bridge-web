import { RtwMeetingRepository } from "@/providers/repositories/rtw-meeting.repository";
import { SicknessCaseRepository } from "@/providers/repositories/sickness-case.repository";
import { EmployeeRepository } from "@/providers/repositories/employee.repository";
import { OrganisationRepository } from "@/providers/repositories/organisation.repository";
import { EncryptionService } from "@/providers/services/encryption.service";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { NotificationService } from "@/providers/services/notification.service";
import { TenantService } from "@/providers/services/tenant.service";
import { WorkflowService } from "@/providers/services/workflow.service";
import { RtwMeeting } from "@/types/database";
import { AuditAction, AuditEntity } from "@/types/enums";
import { SicknessAction, RtwMeetingStatus } from "@/constants/sickness-states";

/**
 * RtwMeetingService -- business logic for return-to-work meeting scheduling,
 * completion, and cancellation. Integrates with WorkflowService for state transitions.
 */
export class RtwMeetingService {
  /**
   * Schedule a new RTW meeting for a sickness case.
   * Triggers SCHEDULE_RTW state transition.
   */
  static async schedule(
    caseId: string,
    scheduledDate: string,
    userId: string,
    organisationId: string,
  ): Promise<RtwMeeting> {
    // Fetch the case to get employee ID for the meeting record
    const sicknessCase = await TenantService.withTenant(organisationId, false, async (client) => {
      return SicknessCaseRepository.findById(caseId, client);
    });

    if (!sicknessCase || sicknessCase.organisationId !== organisationId) {
      throw new Error("Sickness case not found");
    }

    // Create RTW meeting within tenant context
    const meeting = await TenantService.withTenant(organisationId, false, async (client) => {
      return RtwMeetingRepository.create(
        {
          organisationId,
          sicknessCaseId: caseId,
          employeeId: sicknessCase.employeeId,
          scheduledBy: userId,
          scheduledDate,
        },
        client,
      );
    });

    // Trigger state transition: current state -> RTW_SCHEDULED
    await WorkflowService.transition(caseId, SicknessAction.SCHEDULE_RTW, userId, organisationId);

    // Log audit
    await AuditLogService.log({
      userId,
      organisationId,
      action: AuditAction.SCHEDULE,
      entity: AuditEntity.RTW_MEETING,
      entityId: meeting.id,
      metadata: {
        sicknessCaseId: caseId,
        scheduledDate,
      },
    });

    // Fire-and-forget: notify employee about scheduled RTW meeting (NOTF-03)
    try {
      const employeeEmail = await EmployeeRepository.getEmployeeEmail(sicknessCase.employeeId);
      if (employeeEmail) {
        const employee = await EmployeeRepository.findById(sicknessCase.employeeId);
        const org = await OrganisationRepository.findById(organisationId);
        const orgName = org?.name || "Your Organisation";
        await NotificationService.notifyRtwScheduled(
          { sicknessCaseId: caseId, scheduledDate },
          { email: employeeEmail, userId: employee?.userId || undefined },
          orgName,
          organisationId,
        );
      }
    } catch (notifError) {
      console.error("[RtwMeetingService] Failed to send RTW meeting notification:", notifError);
    }

    return meeting;
  }

  /**
   * Complete an RTW meeting with questionnaire responses, outcomes, and adjustments.
   * Triggers COMPLETE_RTW state transition.
   */
  static async complete(
    meetingId: string,
    data: {
      questionnaireResponses: Record<string, unknown>;
      outcomes: string;
      adjustments: Array<{ type: string; description: string; reviewDate?: string }>;
    },
    userId: string,
    organisationId: string,
  ): Promise<RtwMeeting> {
    // Fetch meeting and verify status
    const existingMeeting = await TenantService.withTenant(organisationId, false, async (client) => {
      return RtwMeetingRepository.findById(meetingId, client);
    });

    if (!existingMeeting || existingMeeting.organisationId !== organisationId) {
      throw new Error("RTW meeting not found");
    }

    if (existingMeeting.status !== RtwMeetingStatus.SCHEDULED) {
      throw new Error("RTW meeting is not in SCHEDULED status");
    }

    // Encrypt outcomes
    const outcomesEncrypted = EncryptionService.encryptField(data.outcomes);

    // Update meeting
    const updatedMeeting = await TenantService.withTenant(organisationId, false, async (client) => {
      return RtwMeetingRepository.update(
        meetingId,
        {
          status: RtwMeetingStatus.COMPLETED,
          completedDate: new Date().toISOString(),
          questionnaireResponses: data.questionnaireResponses,
          outcomesEncrypted,
          adjustments: data.adjustments,
        },
        client,
      );
    });

    // Trigger state transition: RTW_SCHEDULED -> RTW_COMPLETED
    await WorkflowService.transition(
      existingMeeting.sicknessCaseId,
      SicknessAction.COMPLETE_RTW,
      userId,
      organisationId,
    );

    // Log audit
    await AuditLogService.log({
      userId,
      organisationId,
      action: AuditAction.UPDATE,
      entity: AuditEntity.RTW_MEETING,
      entityId: meetingId,
      metadata: {
        sicknessCaseId: existingMeeting.sicknessCaseId,
        action: "complete",
        adjustmentCount: data.adjustments.length,
      },
    });

    return updatedMeeting;
  }

  /**
   * Cancel an RTW meeting. Does NOT trigger a state transition --
   * the case stays in its current state.
   */
  static async cancel(meetingId: string, userId: string, organisationId: string): Promise<RtwMeeting> {
    const existingMeeting = await TenantService.withTenant(organisationId, false, async (client) => {
      return RtwMeetingRepository.findById(meetingId, client);
    });

    if (!existingMeeting || existingMeeting.organisationId !== organisationId) {
      throw new Error("RTW meeting not found");
    }

    if (existingMeeting.status !== RtwMeetingStatus.SCHEDULED) {
      throw new Error("Can only cancel meetings in SCHEDULED status");
    }

    const updatedMeeting = await TenantService.withTenant(organisationId, false, async (client) => {
      return RtwMeetingRepository.update(
        meetingId,
        { status: RtwMeetingStatus.CANCELLED },
        client,
      );
    });

    // Log audit
    await AuditLogService.log({
      userId,
      organisationId,
      action: AuditAction.UPDATE,
      entity: AuditEntity.RTW_MEETING,
      entityId: meetingId,
      metadata: {
        sicknessCaseId: existingMeeting.sicknessCaseId,
        action: "cancel",
      },
    });

    return updatedMeeting;
  }

  /**
   * Get all RTW meetings for a sickness case.
   */
  static async getForCase(caseId: string, organisationId: string): Promise<RtwMeeting[]> {
    return TenantService.withTenant(organisationId, false, async (client) => {
      return RtwMeetingRepository.findByCaseId(caseId, client);
    });
  }
}
