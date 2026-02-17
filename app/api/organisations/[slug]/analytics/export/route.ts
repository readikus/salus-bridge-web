import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { OrganisationService } from "@/providers/services/organisation.service";
import { AnalyticsService } from "@/providers/services/analytics.service";
import { TenantService } from "@/providers/services/tenant.service";
import { AuditLogService } from "@/providers/services/audit-log.service";
import { analyticsExportSchema } from "@/schemas/analytics";
import { PERMISSIONS } from "@/constants/permissions";
import { AuditAction, AuditEntity, UserRole } from "@/types/enums";

/**
 * GET /api/organisations/[slug]/analytics/export
 * Export analytics data as CSV or PDF (print-ready HTML).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const organisation = await OrganisationService.getBySlug(slug);
    if (!organisation) {
      return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
    }

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.EXPORT_ANALYTICS, organisation.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = request.nextUrl;
    const parseResult = analyticsExportSchema.safeParse({
      format: searchParams.get("format"),
      period: searchParams.get("period") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      groupBy: searchParams.get("groupBy") || undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const { format, ...queryParams } = parseResult.data;

    // Determine user's highest role for this org
    const orgRole = sessionUser.roles.find((r) => r.organisationId === organisation.id);
    const userRole = sessionUser.isSuperAdmin ? UserRole.PLATFORM_ADMIN : orgRole?.role || UserRole.EMPLOYEE;

    // Audit log the export
    await AuditLogService.log({
      userId: sessionUser.id,
      organisationId: organisation.id,
      action: AuditAction.EXPORT,
      entity: AuditEntity.ANALYTICS,
      metadata: {
        format,
        period: queryParams.period,
        groupBy: queryParams.groupBy,
        departmentId: queryParams.departmentId,
      },
    });

    if (format === "csv") {
      const csv = await TenantService.withTenant(organisation.id, false, async (client) => {
        return AnalyticsService.exportCSV(organisation.id, queryParams, sessionUser.id, userRole, client);
      });

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="analytics-${organisation.slug}-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // PDF format: return print-ready HTML
    const html = await TenantService.withTenant(organisation.id, false, async (client) => {
      return AnalyticsService.exportHTML(organisation.id, queryParams, sessionUser.id, userRole, client);
    });

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error in GET /api/organisations/[slug]/analytics/export:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
