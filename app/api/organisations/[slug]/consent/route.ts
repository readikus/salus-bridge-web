import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { MedicalConsentRepository } from "@/providers/repositories/medical-consent.repository";
import { TenantService } from "@/providers/services/tenant.service";
import { PERMISSIONS } from "@/constants/permissions";

/**
 * GET /api/organisations/[slug]/consent
 * List all employee consent statuses for an organisation.
 * Requires VIEW_CONSENT permission (HR, Org Admin, Platform Admin).
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const organisationId = sessionUser.currentOrganisationId;
    if (!organisationId) {
      return NextResponse.json({ error: "No organisation context" }, { status: 400 });
    }

    if (!AuthService.validateAccess(sessionUser, PERMISSIONS.VIEW_CONSENT, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const isPlatformAdmin = sessionUser.isSuperAdmin;
    const consents = await TenantService.withTenant(organisationId, isPlatformAdmin, async (client) => {
      return MedicalConsentRepository.findByOrganisation(organisationId, client);
    });

    return NextResponse.json({ consents });
  } catch (error) {
    console.error("Error in GET /api/organisations/[slug]/consent:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
