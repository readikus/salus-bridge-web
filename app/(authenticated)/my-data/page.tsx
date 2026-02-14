"use client";

import React, { useEffect, useState } from "react";
import { DataSubjectView } from "@/components/data-subject-view";
import { fetchMyData } from "@/actions/employees";
import { DataSubjectRecord } from "@/types/database";

/**
 * My Data page -- SAR readiness (COMP-05).
 * Shows all data held about the current user.
 */
export default function MyDataPage() {
  const [data, setData] = useState<DataSubjectRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await fetchMyData();
        setData(result);
      } catch (error: any) {
        setHasError(error.message || "Failed to load your data");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{hasError}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <p className="text-gray-500">No data found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Data</h1>
        <p className="mt-1 text-sm text-gray-500">
          All data held about you in the system. You have the right to request this information at any time.
        </p>
      </div>

      <DataSubjectView data={data} />
    </div>
  );
}
