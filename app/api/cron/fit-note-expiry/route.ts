import { NextRequest, NextResponse } from "next/server";
import { FitNoteService } from "@/providers/services/fit-note.service";

const DEFAULT_EXPIRY_DAYS = 3;

/**
 * GET /api/cron/fit-note-expiry
 * FIT-03: Identify fit notes expiring within a configurable number of days.
 * Protected by CRON_SECRET environment variable in the Authorization header.
 *
 * Designed to be called by Vercel Cron Jobs or an external cron scheduler.
 * Does NOT send notifications -- that is handled by plan 02-05.
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

    // Log findings for monitoring (notifications handled by plan 02-05)
    if (expiringNotes.length > 0) {
      console.log(
        `[fit-note-expiry] Found ${expiringNotes.length} fit note(s) expiring within ${days} days`,
        expiringNotes.map((n) => ({
          fitNoteId: n.id,
          caseId: n.sicknessCaseId,
          endDate: n.endDate,
          employeeName: n.employeeName,
        })),
      );
    }

    return NextResponse.json({
      expiringCount: expiringNotes.length,
      notes: expiringNotes.map((n) => ({
        id: n.id,
        sicknessCaseId: n.sicknessCaseId,
        employeeName: n.employeeName,
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
