import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { OrganisationService } from "@/providers/services/organisation.service";
import { OhReferralService } from "@/providers/services/oh-referral.service";
import { updateReferralStatusSchema } from "@/schemas/oh-referral";
import { PERMISSIONS } from "@/constants/permissions";

/**
 * GET /api/organisations/[slug]/oh-referrals/[id]
 * Get referral detail with communications.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const { slug, id } = await params;
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

    const result = await OhReferralService.getById(id, organisation.id);
    if (!result) {
      return NextResponse.json({ error: "Referral not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/organisations/[slug]/oh-referrals/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/organisations/[slug]/oh-referrals/[id]
 * Update referral status.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const { slug, id } = await params;
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
    const parsed = updateReferralStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const referral = await OhReferralService.updateStatus(
      id,
      parsed.data.status,
      parsed.data.reportNotesEncrypted,
      sessionUser.id,
      organisation.id,
    );

    return NextResponse.json({ referral });
  } catch (error: any) {
    if (error.message?.includes("Invalid status transition")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error.message?.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Error in PATCH /api/organisations/[slug]/oh-referrals/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
