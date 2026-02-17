import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { OrganisationService } from "@/providers/services/organisation.service";
import { AnalyticsService } from "@/providers/services/analytics.service";
import { TenantService } from "@/providers/services/tenant.service";
import { analyticsQuerySchema } from "@/schemas/analytics";
import { PERMISSIONS } from "@/constants/permissions";
import { UserRole } from "@/types/enums";

/**
 * GET /api/organisations/[slug]/analytics
 * Returns analytics data: absence rates, trends, and Bradford Factor scores.
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

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.VIEW_ANALYTICS, organisation.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = request.nextUrl;
    const parseResult = analyticsQuerySchema.safeParse({
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

    // Determine user's highest role for this org
    const orgRole = sessionUser.roles.find((r) => r.organisationId === organisation.id);
    const userRole = sessionUser.isSuperAdmin ? UserRole.PLATFORM_ADMIN : orgRole?.role || UserRole.EMPLOYEE;

    const data = await TenantService.withTenant(organisation.id, false, async (client) => {
      return AnalyticsService.getAnalytics(organisation.id, parseResult.data, sessionUser.id, userRole, client);
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/organisations/[slug]/analytics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
