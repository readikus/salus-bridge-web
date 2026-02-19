import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { AuthService } from "@/providers/services/auth.service";
import { EmployeeRepository } from "@/providers/repositories/employee.repository";
import { MedicalConsentRepository } from "@/providers/repositories/medical-consent.repository";
import { GpService } from "@/providers/services/gp.service";
import { TenantService } from "@/providers/services/tenant.service";
import { PERMISSIONS } from "@/constants/permissions";
import { medicalConsentSchema } from "@/schemas/gp-details";

/**
 * GET /api/employees/[id]/consent
 * Get the medical records consent status for an employee.
 * Own data or VIEW_CONSENT permission.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const organisationId = sessionUser.currentOrganisationId;
    if (!organisationId) {
      return NextResponse.json({ error: "No organisation context" }, { status: 400 });
    }

    const { id } = await params;

    // Check ownership or permission
    const employee = await EmployeeRepository.findById(id);
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const isOwner = employee.userId === sessionUser.id;
    if (!isOwner && !AuthService.validateAccess(sessionUser, PERMISSIONS.VIEW_CONSENT, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const isPlatformAdmin = sessionUser.isSuperAdmin;
    const consent = await TenantService.withTenant(organisationId, isPlatformAdmin, async (client) => {
      return MedicalConsentRepository.findByEmployee(id, client);
    });

    return NextResponse.json({ consent });
  } catch (error) {
    console.error("Error in GET /api/employees/[id]/consent:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/employees/[id]/consent
 * Grant or revoke medical records consent.
 * Own data or MANAGE_CONSENT permission.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionUser = await getAuthenticatedUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const organisationId = sessionUser.currentOrganisationId;
    if (!organisationId) {
      return NextResponse.json({ error: "No organisation context" }, { status: 400 });
    }

    const { id } = await params;

    // Check ownership or permission
    const employee = await EmployeeRepository.findById(id);
    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const isOwner = employee.userId === sessionUser.id;
    if (!isOwner && !AuthService.validateAccess(sessionUser, PERMISSIONS.MANAGE_CONSENT, organisationId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = medicalConsentSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const isPlatformAdmin = sessionUser.isSuperAdmin;
    const consent = await TenantService.withTenant(organisationId, isPlatformAdmin, async (client) => {
      if (parseResult.data.consentStatus === "GRANTED") {
        return GpService.grantConsent(id, sessionUser.id, organisationId, parseResult.data.notes, client);
      } else {
        return GpService.revokeConsent(id, sessionUser.id, organisationId, parseResult.data.notes, client);
      }
    });

    return NextResponse.json({ consent });
  } catch (error) {
    console.error("Error in POST /api/employees/[id]/consent:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
