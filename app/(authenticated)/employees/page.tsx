"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { EmployeeTable } from "@/components/employee-table";
import { fetchEmployees, fetchSendInvitation, fetchDeactivateEmployee } from "@/actions/employees";
import { useAuth } from "@/hooks/use-auth";
import { PERMISSIONS } from "@/constants/permissions";
import { EmployeeWithDetails } from "@/types/database";

export default function EmployeesPage() {
  const { can, isLoading: isAuthLoading } = useAuth();
  const [employees, setEmployees] = useState<EmployeeWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const loadEmployees = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const filters = statusFilter ? { status: statusFilter } : undefined;
      const data = await fetchEmployees(filters);
      setEmployees(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (!isAuthLoading) {
      loadEmployees();
    }
  }, [loadEmployees, isAuthLoading]);

  const handleInvite = async (employeeId: string) => {
    try {
      const result = await fetchSendInvitation(employeeId);
      // Copy invitation URL to clipboard for now (email delivery deferred)
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(result.invitationUrl);
        alert("Invitation link copied to clipboard!");
      } else {
        alert(`Invitation URL: ${result.invitationUrl}`);
      }
      loadEmployees();
    } catch (err: any) {
      alert(`Failed to send invitation: ${err.message}`);
    }
  };

  const handleDeactivate = async (employeeId: string) => {
    if (!confirm("Are you sure you want to deactivate this employee? This action can be reversed by an admin.")) {
      return;
    }
    try {
      await fetchDeactivateEmployee(employeeId);
      loadEmployees();
    } catch (err: any) {
      alert(`Failed to deactivate employee: ${err.message}`);
    }
  };

  // Extract unique departments for potential filtering
  const departments = [...new Set(employees.map((e) => e.departmentName).filter(Boolean))] as string[];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Employees</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your organisation's employees, roles, and invitations.
          </p>
        </div>
        {can(PERMISSIONS.MANAGE_EMPLOYEES) && (
          <div className="flex items-center gap-3">
            <Link
              href="/employees/new"
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </Link>
            <Link
              href="/import"
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </Link>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-4">
        <div>
          <label htmlFor="status-filter" className="sr-only">
            Filter by status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INVITED">Invited</option>
            <option value="DEACTIVATED">Deactivated</option>
          </select>
        </div>
        <span className="text-sm text-gray-500">
          {employees.length} employee{employees.length !== 1 ? "s" : ""}
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <EmployeeTable
        employees={employees}
        onInvite={can(PERMISSIONS.SEND_INVITATIONS) ? handleInvite : undefined}
        onDeactivate={can(PERMISSIONS.MANAGE_EMPLOYEES) ? handleDeactivate : undefined}
        isLoading={isLoading}
      />
    </div>
  );
}
