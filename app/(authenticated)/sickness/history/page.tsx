"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AbsenceHistory } from "@/components/absence-history";
import { fetchSicknessCases, SicknessCaseFilters } from "@/actions/sickness-cases";
import { useAuth } from "@/hooks/use-auth";
import { PERMISSIONS } from "@/constants/permissions";
import { SicknessCase } from "@/types/database";

export default function AbsenceHistoryPage() {
  const { can, isLoading: isAuthLoading } = useAuth();
  const [cases, setCases] = useState<SicknessCase[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCases = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchSicknessCases();
      setCases(data.cases);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading) {
      loadCases();
    }
  }, [loadCases, isAuthLoading]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Absence History</h1>
          <p className="mt-1 text-sm text-gray-500">View and manage sickness absence cases.</p>
        </div>
        {can(PERMISSIONS.REPORT_SICKNESS) && (
          <Link
            href="/sickness/report"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Report Sickness
          </Link>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-gray-500">Loading absence history...</p>
        </div>
      ) : (
        <AbsenceHistory cases={cases} total={total} />
      )}
    </div>
  );
}
