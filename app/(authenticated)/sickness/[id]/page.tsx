"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SicknessCaseDetail } from "@/components/sickness-case-detail";
import { fetchSicknessCase, SicknessCaseDetailResponse } from "@/actions/sickness-cases";

export default function SicknessCaseDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<SicknessCaseDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;

    fetchSicknessCase(params.id)
      .then((response) => {
        setData(response);
      })
      .catch((err: any) => {
        setHasError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">Loading case details...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div>
        <Link
          href="/sickness/history"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Absence History
        </Link>
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{hasError}</div>
      </div>
    );
  }

  if (!data) return null;

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
        <h1 className="text-2xl font-semibold text-gray-900">Sickness Case Detail</h1>
      </div>

      <SicknessCaseDetail
        sicknessCase={data.sicknessCase}
        transitions={data.transitions}
        availableActions={data.availableActions}
        canManage={data.canManage}
      />
    </div>
  );
}
