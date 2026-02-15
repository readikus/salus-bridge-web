"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FitNoteUpload } from "@/components/fit-note-upload";
import { FitNoteList } from "@/components/fit-note-list";
import { fetchFitNotes } from "@/actions/fit-notes";
import { useAuth } from "@/hooks/use-auth";
import { FitNote } from "@/types/database";
import { UserRole } from "@/types/enums";

export default function FitNotesPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [fitNotes, setFitNotes] = useState<FitNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState<string | null>(null);

  const loadFitNotes = useCallback(async () => {
    if (!params.id) return;
    try {
      const response = await fetchFitNotes(params.id);
      setFitNotes(response.fitNotes);
      setHasError(null);
    } catch (err: any) {
      setHasError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadFitNotes();
  }, [loadFitNotes]);

  // Determine if the user is a manager-only (should be redirected)
  const isManagerOnly =
    user?.roles &&
    user.roles.some((r) => r.role === UserRole.MANAGER) &&
    !user.roles.some((r) => r.role === UserRole.HR || r.role === UserRole.ORG_ADMIN);

  // Determine if user can upload (HR, ORG_ADMIN, or employee)
  const canUpload =
    user?.roles &&
    (user.roles.some(
      (r) => r.role === UserRole.HR || r.role === UserRole.ORG_ADMIN || r.role === UserRole.PLATFORM_ADMIN,
    ) ||
      user.roles.some((r) => r.role === UserRole.EMPLOYEE));

  if (isManagerOnly) {
    return (
      <div>
        <Link
          href={`/sickness/${params.id}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Case Detail
        </Link>
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Managers do not have access to fit note documents. Please contact HR for fit note information.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-500">Loading fit notes...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/sickness/${params.id}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Case Detail
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Fit Notes</h1>
      </div>

      {hasError && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {hasError}
        </div>
      )}

      <div className="space-y-6">
        <FitNoteList fitNotes={fitNotes} caseId={params.id} />

        {canUpload && <FitNoteUpload caseId={params.id} onUploadComplete={loadFitNotes} />}
      </div>
    </div>
  );
}
