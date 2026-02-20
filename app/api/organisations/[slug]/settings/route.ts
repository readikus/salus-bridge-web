import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { OrganisationService } from "@/providers/services/organisation.service";
import { OrgSettingsSchema } from "@/schemas/organisation";
import { PERMISSIONS } from "@/constants/permissions";

/**
 * GET /api/organisations/[slug]/settings
 * Get organisation settings.
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

    // Check permission: platform admin or org admin
    const isPlatformAdmin = AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_ORGANISATIONS);
    const isOrgAdmin = AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_SETTINGS, organisation.id);

    if (!isPlatformAdmin && !isOrgAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ settings: organisation.settings });
  } catch (error) {
    console.error("Error in GET /api/organisations/[slug]/settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/organisations/[slug]/settings
 * Update organisation settings (org admin only - ORG-05).
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
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

    // Only org admin or platform admin can update settings
    const isPlatformAdmin = AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_ORGANISATIONS);
    const isOrgAdmin = AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_SETTINGS, organisation.id);

    if (!isPlatformAdmin && !isOrgAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = OrgSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updated = await OrganisationService.updateSettings(organisation.id, parsed.data, sessionUser.id);
    return NextResponse.json({ settings: updated.settings });
  } catch (error) {
    console.error("Error in PATCH /api/organisations/[slug]/settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
