"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { UserCircle, Building2, Shield } from "lucide-react";
import { fetchMyData } from "@/actions/employees";
import { GpDetailsForm } from "@/components/gp-details-form";
import { ConsentForm } from "@/components/consent-form";

export default function MyProfilePage() {
  const { user, isLoading, roles } = useAuth();
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchMyData()
      .then((data) => {
        if (data?.personalInfo?.id) {
          setEmployeeId(data.personalInfo.id);
        }
      })
      .catch(() => {
        // User may not have an employee record (e.g. platform admin)
      });
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-12 text-center">
        <p className="text-red-700">Unable to load profile.</p>
      </div>
    );
  }

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const organisationName = roles.length > 0 ? roles[0].organisationName : null;
  const userRoles = roles.map((r) => r.role);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Your account information and roles.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Info */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <UserCircle className="h-10 w-10 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-medium text-gray-900">
                  {displayName || "Name not set"}
                </h2>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <p className="mt-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                    {user.firstName || "---"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <p className="mt-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                    {user.lastName || "---"}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <p className="mt-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                  {user.email}
                </p>
              </div>

              <p className="text-xs text-gray-400">
                Profile details are managed by your organisation admin. Contact them to request changes.
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar: Organisation and Roles */}
        <div className="space-y-6">
          {/* Organisation */}
          {organisationName && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-3 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-medium text-gray-900">Organisation</h2>
              </div>
              <p className="text-sm text-gray-600">{organisationName}</p>
            </div>
          )}

          {/* Roles */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-medium text-gray-900">Your Roles</h2>
            </div>
            {userRoles.length > 0 ? (
              <div className="space-y-2">
                {userRoles.map((role) => (
                  <div
                    key={role}
                    className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  >
                    {role.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No roles assigned yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* GP Details and Medical Consent -- only shown for users with an employee record */}
      {employeeId && (
        <div className="mt-8 space-y-8">
          <GpDetailsForm employeeId={employeeId} />
          <ConsentForm employeeId={employeeId} />
        </div>
      )}
    </div>
  );
}
