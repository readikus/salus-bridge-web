import sgMail from "@sendgrid/mail";
import { render } from "@react-email/components";
import { validateNotificationPayload } from "@/constants/notification-privacy";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { AuditAction, AuditEntity } from "@/types/enums";
import { SicknessReportedEmail } from "@/emails/sickness-reported";
import { FitNoteExpiringEmail } from "@/emails/fit-note-expiring";
import { RtwMeetingScheduledEmail } from "@/emails/rtw-meeting-scheduled";

interface SendParams {
  to: string;
  subject: string;
  html: string;
  organisationId: string;
  notificationType: string;
  recipientUserId?: string;
}

/**
 * NotificationService -- privacy-validated email dispatch via SendGrid.
 * COMP-03: All notification content is validated against forbidden patterns
 * before sending. Notifications are fire-and-forget (failures logged, never thrown).
 */
export class NotificationService {
  /**
   * Send a privacy-validated email notification.
   * Validates content against NOTIFICATION_FORBIDDEN_PATTERNS before dispatch.
   * Skips send gracefully if SENDGRID_API_KEY is not configured.
   */
  static async send(params: SendParams): Promise<void> {
    // Validate notification content against privacy rules
    const validation = validateNotificationPayload({
      subject: params.subject,
      body: params.html,
    });

    if (!validation.valid) {
      throw new Error(
        `Notification privacy violation: ${validation.violations.join("; ")}. Notification NOT sent.`,
      );
    }

    // Check SendGrid configuration
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@salusbridge.com";

    if (!apiKey) {
      console.warn("[NotificationService] SENDGRID_API_KEY not set -- skipping email send");
      return;
    }

    sgMail.setApiKey(apiKey);

    await sgMail.send({
      to: params.to,
      from: fromEmail,
      subject: params.subject,
      html: params.html,
    });

    // Log send via audit
    await AuditLogService.log({
      organisationId: params.organisationId,
      userId: params.recipientUserId,
      action: AuditAction.SEND,
      entity: AuditEntity.NOTIFICATION,
      metadata: {
        notificationType: params.notificationType,
        recipientEmail: params.to,
      },
    });
  }

  /**
   * NOTF-01: Notify manager that a team member has reported an absence.
   * Subject and body are generic -- NO employee name, NO absence type, NO condition.
   */
  static async notifySicknessReported(
    sicknessCase: { id: string; absenceStartDate: string },
    manager: { email: string; userId?: string },
    organisationName: string,
    organisationId: string,
  ): Promise<void> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.salusbridge.com";
    const caseUrl = `${appUrl}/sickness/${sicknessCase.id}`;

    const html = await render(
      SicknessReportedEmail({
        organisationName,
        dateReported: new Date(sicknessCase.absenceStartDate).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        caseUrl,
      }),
    );

    await NotificationService.send({
      to: manager.email,
      subject: "Action required: A team member has reported an absence",
      html,
      organisationId,
      notificationType: "SICKNESS_REPORTED",
      recipientUserId: manager.userId,
    });
  }

  /**
   * NOTF-02: Notify manager and HR that a fit note is approaching expiry.
   * Subject and body are generic -- NO employee name, NO fit note details.
   */
  static async notifyFitNoteExpiring(
    fitNote: { sicknessCaseId: string; endDate: string },
    recipients: { email: string; userId?: string }[],
    organisationName: string,
    organisationId: string,
  ): Promise<void> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.salusbridge.com";
    const caseUrl = `${appUrl}/sickness/${fitNote.sicknessCaseId}`;

    const html = await render(
      FitNoteExpiringEmail({
        organisationName,
        expiryDate: new Date(fitNote.endDate).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        caseUrl,
      }),
    );

    for (const recipient of recipients) {
      await NotificationService.send({
        to: recipient.email,
        subject: "Reminder: Action needed - document expiring soon",
        html,
        organisationId,
        notificationType: "FIT_NOTE_EXPIRING",
        recipientUserId: recipient.userId,
      });
    }
  }

  /**
   * NOTF-03: Notify employee that a RTW meeting has been scheduled.
   * Subject and body are generic -- NO meeting details beyond date.
   */
  static async notifyRtwScheduled(
    meeting: { sicknessCaseId: string; scheduledDate: string },
    employee: { email: string; userId?: string },
    organisationName: string,
    organisationId: string,
  ): Promise<void> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.salusbridge.com";
    const caseUrl = `${appUrl}/sickness/${meeting.sicknessCaseId}`;

    const html = await render(
      RtwMeetingScheduledEmail({
        organisationName,
        scheduledDate: new Date(meeting.scheduledDate).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        caseUrl,
      }),
    );

    await NotificationService.send({
      to: employee.email,
      subject: "Update: A meeting has been scheduled",
      html,
      organisationId,
      notificationType: "RTW_MEETING_SCHEDULED",
      recipientUserId: employee.userId,
    });
  }
}
