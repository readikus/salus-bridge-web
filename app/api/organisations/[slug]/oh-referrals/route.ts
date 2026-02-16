import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { OrganisationService } from "@/providers/services/organisation.service";
import { OhReferralService } from "@/providers/services/oh-referral.service";
import { createOhReferralSchema } from "@/schemas/oh-referral";
import { PERMISSIONS } from "@/constants/permissions";
import { UserRole } from "@/types/enums";

/**
 * GET /api/organisations/[slug]/oh-referrals
 * List referrals for an organisation. Managers see only their direct reports.
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

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.VIEW_REFERRALS, organisation.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filters: { status?: string; employeeId?: string; providerId?: string } = {};
    if (searchParams.get("status")) filters.status = searchParams.get("status")!;
    if (searchParams.get("employeeId")) filters.employeeId = searchParams.get("employeeId")!;
    if (searchParams.get("providerId")) filters.providerId = searchParams.get("providerId")!;

    const referrals = await OhReferralService.listByOrganisation(organisation.id, filters);

    return NextResponse.json({ referrals });
  } catch (error) {
    console.error("Error in GET /api/organisations/[slug]/oh-referrals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/organisations/[slug]/oh-referrals
 * Create a new OH referral.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
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

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.CREATE_REFERRAL, organisation.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createOhReferralSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const referral = await OhReferralService.create(parsed.data, sessionUser.id, organisation.id);

    return NextResponse.json({ referral }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes("Sickness case not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Error in POST /api/organisations/[slug]/oh-referrals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
