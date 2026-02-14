"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CsvImportWizard } from "@/components/csv-import-wizard";
import { useAuth } from "@/hooks/use-auth";

/**
 * CSV Import page -- org admin only (ORG-01).
 * Upload CSV -> validate -> confirm import -> results summary.
 */
export default function EmployeeImportPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  if (!user?.currentOrganisationId) {
    return (
      <div className="p-8">
        <p className="text-gray-500">No organisation context. Please select an organisation first.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Employees</h1>
        <p className="mt-1 text-sm text-gray-500">Bulk import employees from a CSV file</p>
      </div>

      <CsvImportWizard
        organisationId={user.currentOrganisationId}
        onComplete={() => router.push("/employees")}
      />
    </div>
  );
}
