import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { OrganisationService } from "@/providers/services/organisation.service";
import { OhReferralService } from "@/providers/services/oh-referral.service";
import { OhReferralRepository } from "@/providers/repositories/oh-referral.repository";
import { TenantService } from "@/providers/services/tenant.service";
import { addCommunicationSchema } from "@/schemas/oh-referral";
import { PERMISSIONS } from "@/constants/permissions";

/**
 * GET /api/organisations/[slug]/oh-referrals/[id]/communications
 * List communications for a referral.
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

    const communications = await TenantService.withTenant(organisation.id, false, async (client) => {
      return OhReferralRepository.getCommunications(id, client);
    });

    return NextResponse.json({ communications });
  } catch (error) {
    console.error("Error in GET /api/organisations/[slug]/oh-referrals/[id]/communications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/organisations/[slug]/oh-referrals/[id]/communications
 * Add a communication to a referral.
 */
export async function POST(
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
    const parsed = addCommunicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const communication = await OhReferralService.addCommunication(
      id,
      parsed.data.direction,
      parsed.data.message,
      sessionUser.id,
      organisation.id,
    );

    return NextResponse.json({ communication }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("Error in POST /api/organisations/[slug]/oh-referrals/[id]/communications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
