import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthenticatedUser } from "@/providers/supabase/auth-helpers";
import { ORG_COOKIE_NAME, ORG_COOKIE_MAX_AGE } from "@/constants/org-cookie";

export async function POST(request: NextRequest) {
  const sessionUser = await getAuthenticatedUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { organisationId } = await request.json();
  if (!organisationId || typeof organisationId !== "string") {
    return NextResponse.json({ error: "organisationId is required" }, { status: 400 });
  }

  // Validate user has a role in the requested org
  const hasAccess = sessionUser.roles.some((r) => r.organisationId === organisationId);
  if (!hasAccess) {
    return NextResponse.json({ error: "No access to this organisation" }, { status: 403 });
  }

  // Set the cookie
  const cookieStore = await cookies();
  cookieStore.set(ORG_COOKIE_NAME, organisationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ORG_COOKIE_MAX_AGE,
    path: "/",
  });

  return NextResponse.json({ success: true });
}
