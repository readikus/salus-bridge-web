"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SicknessReportForm } from "@/components/sickness-report-form";
import { fetchEmployees } from "@/actions/employees";
import { useAuth } from "@/hooks/use-auth";
import { EmployeeWithDetails } from "@/types/database";
import { UserRole } from "@/types/enums";

export default function ReportSicknessPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [employees, setEmployees] = useState<EmployeeWithDetails[]>([]);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | undefined>();
  const [isManagerReporting, setIsManagerReporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthLoading || !user) return;

    const orgId = user.currentOrganisationId;
    if (!orgId) return;

    const isAdminOrHR = user.isSuperAdmin || user.roles.some(
      (r) =>
        r.organisationId === orgId &&
        (r.role === UserRole.ORG_ADMIN || r.role === UserRole.HR),
    );

    const isManager = user.roles.some(
      (r) => r.organisationId === orgId && r.role === UserRole.MANAGER,
    );

    if (isAdminOrHR || isManager) {
      setIsManagerReporting(true);
      // Fetch employees for the dropdown
      fetchEmployees()
        .then((emps) => {
          setEmployees(emps);
          // Also find the current user's employee record
          const currentEmp = emps.find((e) => e.userId === user.id);
          if (currentEmp) setCurrentEmployeeId(currentEmp.id);
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      // Employee self-reporting: fetch to find own employee ID
      fetchEmployees()
        .then((emps) => {
          const currentEmp = emps.find((e) => e.userId === user.id);
          if (currentEmp) setCurrentEmployeeId(currentEmp.id);
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [user, isAuthLoading]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/sickness/history"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Absence History
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Report Sickness Absence</h1>
        <p className="mt-1 text-sm text-gray-500">
          {isManagerReporting
            ? "Report a sickness absence for yourself or a team member."
            : "Report your sickness absence."}
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <SicknessReportForm
          employees={employees}
          currentEmployeeId={currentEmployeeId}
          isManagerReporting={isManagerReporting}
        />
      </div>
    </div>
  );
}
