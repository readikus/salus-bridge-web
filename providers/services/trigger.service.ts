import { TriggerConfigRepository } from "@/providers/repositories/trigger-config.repository";
import { TriggerAlertRepository, TriggerAlertFilters } from "@/providers/repositories/trigger-alert.repository";
import { SicknessCaseRepository } from "@/providers/repositories/sickness-case.repository";
import { EmployeeRepository } from "@/providers/repositories/employee.repository";
import { BradfordFactorService } from "@/providers/services/bradford-factor.service";
import { NotificationService } from "@/providers/services/notification.service";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { OrganisationRepository } from "@/providers/repositories/organisation.repository";
import { TriggerConfig, TriggerAlert, TriggerAlertWithDetails } from "@/types/database";
import { AuditAction, AuditEntity } from "@/types/enums";
import { TriggerType } from "@/schemas/trigger-config";
import { render } from "@react-email/components";
import { TriggerAlertEmail } from "@/emails/trigger-alert";
import { PoolClient } from "pg";

/**
 * TriggerService -- evaluates trigger configs against employee absence data
 * and fires alerts when thresholds are breached.
 */
export class TriggerService {
  /**
   * Evaluate all active triggers for an organisation against a specific employee.
   * Called after sickness case creation or status transitions.
   */
  static async evaluate(
    employeeId: string,
    organisationId: string,
    sicknessCaseId: string,
    client?: PoolClient,
  ): Promise<void> {
    const configs = await TriggerConfigRepository.findActiveByOrganisation(organisationId, client);

    for (const config of configs) {
      try {
        let triggeredValue: number | null = null;

        switch (config.triggerType) {
          case TriggerType.FREQUENCY: {
            const cases = await SicknessCaseRepository.findByEmployee(employeeId, client);
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - (config.periodDays || 365));
            const relevantCases = cases.filter((c) => new Date(c.absenceStartDate) >= cutoff);
            if (relevantCases.length >= config.thresholdValue) {
              triggeredValue = relevantCases.length;
            }
            break;
          }

          case TriggerType.BRADFORD_FACTOR: {
            const result = await BradfordFactorService.calculate(employeeId, client);
            if (result.score >= config.thresholdValue) {
              triggeredValue = result.score;
            }
            break;
          }

          case TriggerType.DURATION: {
            const cases = await SicknessCaseRepository.findByEmployee(employeeId, client);
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - (config.periodDays || 365));
            const relevantCases = cases.filter((c) => new Date(c.absenceStartDate) >= cutoff);
            const totalDays = relevantCases.reduce((sum, c) => sum + (c.workingDaysLost || 0), 0);
            if (totalDays >= config.thresholdValue) {
              triggeredValue = totalDays;
            }
            break;
          }
        }

        if (triggeredValue !== null) {
          await TriggerService.fireAlert(config, employeeId, sicknessCaseId, triggeredValue, client);
        }
      } catch (error) {
        console.error(`[TriggerService] Error evaluating trigger ${config.id}:`, error);
      }
    }
  }

  /**
   * Fire an alert for a trigger breach.
   * Creates alert record, sends notifications to manager/HR.
   */
  static async fireAlert(
    triggerConfig: TriggerConfig,
    employeeId: string,
    sicknessCaseId: string,
    triggeredValue: number,
    client?: PoolClient,
  ): Promise<void> {
    // Dedup check: prevent duplicate alerts for same trigger+case
    const exists = await TriggerAlertRepository.existsForTriggerAndCase(
      triggerConfig.id,
      sicknessCaseId,
      client,
    );
    if (exists) return;

    // Create the alert record
    const alert = await TriggerAlertRepository.create(
      {
        organisationId: triggerConfig.organisationId,
        triggerConfigId: triggerConfig.id,
        employeeId,
        sicknessCaseId,
        triggeredValue,
      },
      client,
    );

    // Audit log
    await AuditLogService.log({
      organisationId: triggerConfig.organisationId,
      action: AuditAction.ALERT,
      entity: AuditEntity.TRIGGER_ALERT,
      entityId: alert.id,
      metadata: {
        triggerConfigId: triggerConfig.id,
        triggerName: triggerConfig.name,
        triggerType: triggerConfig.triggerType,
        employeeId,
        sicknessCaseId,
        triggeredValue,
        thresholdValue: triggerConfig.thresholdValue,
      },
    });

    // Fire-and-forget: send notification to manager and HR
    try {
      const employee = await EmployeeRepository.findByIdWithDetails(employeeId);
      if (!employee) return;

      const org = await OrganisationRepository.findById(triggerConfig.organisationId);
      const orgName = org?.name || "Your Organisation";

      // Privacy-safe employee name: first name + last initial
      const employeeName = `${employee.firstName || "Employee"} ${(employee.lastName || "")[0] || ""}`.trim();

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.salusbridge.com";
      const alertsUrl = `${appUrl}/organisations/${org?.slug || ""}/triggers`;

      const html = await render(
        TriggerAlertEmail({
          employeeName,
          triggerName: triggerConfig.name,
          triggerType: triggerConfig.triggerType,
          thresholdValue: triggerConfig.thresholdValue,
          actualValue: triggeredValue,
          organisationName: orgName,
          alertsUrl,
        }),
      );

      // Send to manager
      const managerInfo = await EmployeeRepository.getManagerInfo(employeeId);
      if (managerInfo) {
        await NotificationService.send({
          to: managerInfo.email,
          subject: `Absence Trigger Alert - ${employeeName}`,
          html,
          organisationId: triggerConfig.organisationId,
          notificationType: "TRIGGER_ALERT",
          recipientUserId: managerInfo.userId,
        });
      }

      // Send to HR users in the org (via org admins who have HR role)
      // Note: HR users are those with HR role in the organisation
    } catch (notifError) {
      console.error("[TriggerService] Failed to send trigger alert notification:", notifError);
    }
  }

  /**
   * Get trigger alerts for an organisation with optional filters.
   */
  static async getAlerts(
    organisationId: string,
    filters?: TriggerAlertFilters,
    client?: PoolClient,
  ): Promise<TriggerAlertWithDetails[]> {
    return TriggerAlertRepository.findByOrganisation(organisationId, filters, client);
  }

  /**
   * Acknowledge a trigger alert.
   */
  static async acknowledgeAlert(
    alertId: string,
    userId: string,
    organisationId: string,
    client?: PoolClient,
  ): Promise<TriggerAlert> {
    const alert = await TriggerAlertRepository.acknowledge(alertId, userId, client);

    await AuditLogService.log({
      userId,
      organisationId,
      action: AuditAction.ACKNOWLEDGE,
      entity: AuditEntity.TRIGGER_ALERT,
      entityId: alertId,
    });

    return alert;
  }
}
