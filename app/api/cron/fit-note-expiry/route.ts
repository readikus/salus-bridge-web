import { NextRequest, NextResponse } from "next/server";
import { FitNoteService } from "@/providers/services/fit-note.service";
import { NotificationService } from "@/providers/services/notification.service";
import { EmployeeRepository } from "@/providers/repositories/employee.repository";
import { OrganisationRepository } from "@/providers/repositories/organisation.repository";
import { UserRoleRepository } from "@/providers/repositories/user-role.repository";
import { UserRole } from "@/types/enums";

const DEFAULT_EXPIRY_DAYS = 3;

/**
 * GET /api/cron/fit-note-expiry
 * FIT-03 + NOTF-02: Identify fit notes expiring within a configurable number of days
 * and send notification emails to the case manager and HR contacts.
 * Protected by CRON_SECRET environment variable in the Authorization header.
 *
 * Designed to be called by Vercel Cron Jobs or an external cron scheduler.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error("CRON_SECRET environment variable not set");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get days parameter from query string, default to 3
    const { searchParams } = request.nextUrl;
    const days = parseInt(searchParams.get("days") || String(DEFAULT_EXPIRY_DAYS), 10);

    if (isNaN(days) || days < 1 || days > 30) {
      return NextResponse.json({ error: "Invalid days parameter (must be 1-30)" }, { status: 400 });
    }

    const expiringNotes = await FitNoteService.getExpiringFitNotes(days);

    let notificationsSent = 0;

    for (const note of expiringNotes) {
      try {
        // Get manager info for the employee
        const managerInfo = await EmployeeRepository.getManagerInfo(note.employeeId);

        // Get HR users for the organisation
        const hrUsers = await UserRoleRepository.findUsersByRole(note.organisationId, UserRole.HR);

        // Get organisation name
        const org = await OrganisationRepository.findById(note.organisationId);
        const orgName = org?.name || "Your Organisation";

        // Build recipients list (manager + HR, deduplicated by email)
        const recipientMap = new Map<string, { email: string; userId?: string }>();
        if (managerInfo) {
          recipientMap.set(managerInfo.email, { email: managerInfo.email, userId: managerInfo.userId });
        }
        for (const hr of hrUsers) {
          if (!recipientMap.has(hr.email)) {
            recipientMap.set(hr.email, { email: hr.email, userId: hr.userId });
          }
        }

        const recipients = Array.from(recipientMap.values());
        if (recipients.length > 0) {
          await NotificationService.notifyFitNoteExpiring(
            { sicknessCaseId: note.sicknessCaseId, endDate: note.endDate },
            recipients,
            orgName,
            note.organisationId,
          );
          notificationsSent += recipients.length;
        }
      } catch (notifError) {
        console.error(
          `[fit-note-expiry] Failed to send notification for fit note ${note.id}:`,
          notifError,
        );
      }
    }

    if (expiringNotes.length > 0) {
      console.log(
        `[fit-note-expiry] Processed ${expiringNotes.length} expiring fit note(s), sent ${notificationsSent} notification(s)`,
      );
    }

    return NextResponse.json({
      processed: expiringNotes.length,
      notificationsSent,
      notes: expiringNotes.map((n) => ({
        id: n.id,
        sicknessCaseId: n.sicknessCaseId,
        caseStatus: n.caseStatus,
        endDate: n.endDate,
        fitNoteStatus: n.fitNoteStatus,
      })),
    });
  } catch (error) {
    console.error("Error in GET /api/cron/fit-note-expiry:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
