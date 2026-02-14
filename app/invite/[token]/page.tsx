import { redirect } from "next/navigation";
import { InvitationService } from "@/providers/services/invitation.service";
import { Shield, AlertTriangle } from "lucide-react";

interface Props {
  params: Promise<{ token: string }>;
}

/**
 * Invitation landing page.
 * Server Component that validates the token and redirects accordingly:
 * - Valid: redirect to set-password page
 * - Expired: show expiry message
 * - Already used: redirect to login
 */
export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const validation = await InvitationService.validateToken(token);

  if (validation.valid) {
    redirect(`/invite/${token}/set-password`);
  }

  // If employee exists but invitation is no longer valid
  if (validation.employee) {
    // Already accepted — redirect to login
    if (!validation.expired) {
      redirect("/auth/login");
    }

    // Expired
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
          <div className="mb-6 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <h1 className="mb-2 text-center text-xl font-semibold text-gray-900">Invitation Expired</h1>
          <p className="mb-6 text-center text-gray-600">
            This invitation link has expired. Please contact your administrator to request a new invitation.
          </p>
          <div className="text-center">
            <a
              href="/"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Return to home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Token not found at all
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
        </div>
        <h1 className="mb-2 text-center text-xl font-semibold text-gray-900">Invalid Invitation</h1>
        <p className="mb-6 text-center text-gray-600">
          This invitation link is not valid. Please check the link or contact your administrator.
        </p>
        <div className="text-center">
          <a
            href="/"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Return to home
          </a>
        </div>
      </div>
    </div>
  );
}
