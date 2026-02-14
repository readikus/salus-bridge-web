"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  UserX,
  Save,
  Shield,
} from "lucide-react";
import {
  fetchEmployee,
  fetchUpdateEmployee,
  fetchDeactivateEmployee,
  fetchSendInvitation,
} from "@/actions/employees";
import { useAuth } from "@/hooks/use-auth";
import { PERMISSIONS } from "@/constants/permissions";
import { EmployeeWithDetails } from "@/types/database";
import { UserRole, EmployeeStatus } from "@/types/enums";

const ASSIGNABLE_ROLES = [
  { value: UserRole.EMPLOYEE, label: "Employee" },
  { value: UserRole.MANAGER, label: "Manager" },
  { value: UserRole.HR, label: "HR" },
];

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { can } = useAuth();

  const [employee, setEmployee] = useState<EmployeeWithDetails | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Editable form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  const loadEmployee = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchEmployee(id);
      setEmployee(data.employee);
      setRoles(data.roles);
      setFirstName(data.employee.firstName || "");
      setLastName(data.employee.lastName || "");
      setEmail(data.employee.email || "");
      setJobTitle(data.employee.jobTitle || "");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEmployee();
  }, [loadEmployee]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      const data = await fetchUpdateEmployee(id, {
        firstName,
        lastName,
        email,
        jobTitle: jobTitle || null,
        roles,
      });
      setEmployee(data.employee);
      setRoles(data.roles);
      setSuccessMessage("Employee updated successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleToggle = (role: UserRole) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const handleDeactivate = async () => {
    if (!confirm("Are you sure you want to deactivate this employee? Their access will be revoked.")) {
      return;
    }
    try {
      await fetchDeactivateEmployee(id);
      router.push("/employees");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleInvite = async () => {
    try {
      const result = await fetchSendInvitation(id);
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(result.invitationUrl);
        setSuccessMessage("Invitation link copied to clipboard!");
      } else {
        alert(`Invitation URL: ${result.invitationUrl}`);
      }
      setTimeout(() => setSuccessMessage(null), 3000);
      loadEmployee();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-12 text-center">
        <p className="text-red-700">Employee not found.</p>
        <Link href="/employees" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
          Back to Employees
        </Link>
      </div>
    );
  }

  const canManage = can(PERMISSIONS.MANAGE_EMPLOYEES);
  const canInvite = can(PERMISSIONS.SEND_INVITATIONS);
  const canManageRoles = can(PERMISSIONS.MANAGE_ROLES);
  const isDeactivated = employee.status === EmployeeStatus.DEACTIVATED;

  return (
    <div>
      <Link
        href="/employees"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Employees
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{employee.email}</p>
        </div>
        <div className="flex items-center gap-3">
          {canInvite && employee.status !== EmployeeStatus.ACTIVE && !isDeactivated && (
            <button
              onClick={handleInvite}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <Mail className="h-4 w-4" />
              {employee.status === EmployeeStatus.INVITED ? "Resend Invitation" : "Send Invitation"}
            </button>
          )}
          {canManage && !isDeactivated && (
            <button
              onClick={handleDeactivate}
              className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50"
            >
              <UserX className="h-4 w-4" />
              Deactivate
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Employee Details */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-medium text-gray-900">Employee Details</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={!canManage || isDeactivated}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={!canManage || isDeactivated}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!canManage || isDeactivated}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  disabled={!canManage || isDeactivated}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <p className="mt-1 text-sm text-gray-600">
                    {employee.departmentName || "Not assigned"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Manager</label>
                  <p className="mt-1 text-sm text-gray-600">
                    {employee.managerFirstName
                      ? `${employee.managerFirstName} ${employee.managerLastName}`
                      : "Not assigned"}
                  </p>
                </div>
              </div>

              {canManage && !isDeactivated && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Status and Roles */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-3 text-lg font-medium text-gray-900">Status</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Account Status</span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    employee.status === EmployeeStatus.ACTIVE
                      ? "bg-green-100 text-green-700"
                      : employee.status === EmployeeStatus.INVITED
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {employee.status.charAt(0) + employee.status.slice(1).toLowerCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Created</span>
                <span className="text-sm text-gray-900">
                  {new Date(employee.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Role Assignment Card (ORG-03) */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-medium text-gray-900">Roles</h2>
            </div>
            <p className="mb-4 text-xs text-gray-500">
              Roles determine what this employee can access. Multiple roles can be assigned.
            </p>
            <div className="space-y-3">
              {ASSIGNABLE_ROLES.map(({ value, label }) => (
                <label
                  key={value}
                  className="flex items-center gap-3 rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={roles.includes(value)}
                    onChange={() => handleRoleToggle(value)}
                    disabled={!canManageRoles || isDeactivated}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </label>
              ))}
            </div>
            {canManageRoles && !isDeactivated && (
              <p className="mt-3 text-xs text-gray-400">
                Changes are saved when you click "Save Changes".
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
