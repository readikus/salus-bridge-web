"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, ArrowRight, Save } from "lucide-react";
import { fetchTransitionCase, fetchUpdateSicknessCase } from "@/actions/sickness-cases";
import { SicknessCase, CaseTransition } from "@/types/database";
import { SicknessState, SicknessAction } from "@/constants/sickness-states";
import { ABSENCE_TYPE_LABELS, AbsenceType } from "@/constants/absence-types";

interface Props {
  sicknessCase: SicknessCase & { notes?: string };
  transitions: CaseTransition[];
  availableActions: SicknessAction[];
  canManage: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  REPORTED: "bg-yellow-100 text-yellow-800",
  TRACKING: "bg-blue-100 text-blue-800",
  FIT_NOTE_RECEIVED: "bg-purple-100 text-purple-800",
  RTW_SCHEDULED: "bg-indigo-100 text-indigo-800",
  RTW_COMPLETED: "bg-teal-100 text-teal-800",
  CLOSED: "bg-gray-100 text-gray-600",
};

const ACTION_LABELS: Record<string, string> = {
  [SicknessAction.ACKNOWLEDGE]: "Acknowledge",
  [SicknessAction.RECEIVE_FIT_NOTE]: "Receive Fit Note",
  [SicknessAction.SCHEDULE_RTW]: "Schedule RTW Meeting",
  [SicknessAction.COMPLETE_RTW]: "Complete RTW Meeting",
  [SicknessAction.CLOSE_CASE]: "Close Case",
  [SicknessAction.REOPEN]: "Reopen Case",
};

function formatDate(dateStr: string | Date | null): string {
  if (!dateStr) return "---";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function SicknessCaseDetail({ sicknessCase, transitions, availableActions, canManage }: Props) {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionNotes, setTransitionNotes] = useState("");
  const [showNotesModal, setShowNotesModal] = useState<SicknessAction | null>(null);
  const [hasError, setHasError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const toDateInputValue = (dateStr: string | Date | null): string => {
    if (!dateStr) return "";
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    return date.toISOString().split("T")[0];
  };

  const [startDate, setStartDate] = useState(toDateInputValue(sicknessCase.absenceStartDate));
  const [endDate, setEndDate] = useState(toDateInputValue(sicknessCase.absenceEndDate));

  const handleSaveDates = async () => {
    try {
      setIsSaving(true);
      setHasError(null);
      await fetchUpdateSicknessCase(sicknessCase.id, {
        absenceStartDate: startDate,
        absenceEndDate: endDate || undefined,
      });
      setSuccessMessage("Dates updated successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
      router.refresh();
    } catch (err: any) {
      setHasError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTransition = async (action: SicknessAction) => {
    try {
      setIsTransitioning(true);
      setHasError(null);
      await fetchTransitionCase(sicknessCase.id, action, transitionNotes || undefined);
      setShowNotesModal(null);
      setTransitionNotes("");
      router.refresh();
    } catch (err: any) {
      setHasError(err.message);
      setIsTransitioning(false);
    }
  };

  return (
    <div className="space-y-6">
      {hasError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{hasError}</div>
      )}

      {successMessage && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* Case summary card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Sickness Case</h2>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  STATUS_STYLES[sicknessCase.status] || "bg-gray-100 text-gray-600"
                }`}
              >
                {formatStatus(sicknessCase.status)}
              </span>
              {sicknessCase.isLongTerm && (
                <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                  Long-term
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {ABSENCE_TYPE_LABELS[sicknessCase.absenceType as AbsenceType] || sicknessCase.absenceType}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-gray-500">Start Date</p>
            {canManage ? (
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <p className="mt-1 text-sm text-gray-900">{formatDate(sicknessCase.absenceStartDate)}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">End Date</p>
            {canManage ? (
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            ) : (
              <p className="mt-1 text-sm text-gray-900">{formatDate(sicknessCase.absenceEndDate)}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Working Days Lost</p>
            <p className="mt-1 text-sm text-gray-900">
              {sicknessCase.workingDaysLost !== null ? sicknessCase.workingDaysLost : "---"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Reported</p>
            <p className="mt-1 text-sm text-gray-900">{formatDate(sicknessCase.createdAt)}</p>
          </div>
        </div>

        {canManage && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveDates}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Dates"}
            </button>
          </div>
        )}

        {sicknessCase.notes && (
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500">Notes</p>
            <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{sicknessCase.notes}</p>
          </div>
        )}
      </div>

      {/* Available actions */}
      {canManage && availableActions.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-gray-900">Available Actions</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {availableActions.map((action) => (
              <button
                key={action}
                onClick={() => setShowNotesModal(action)}
                disabled={isTransitioning}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {ACTION_LABELS[action] || action}
              </button>
            ))}
          </div>

        </div>
      )}

      {/* Transition notes modal */}
      {showNotesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              {ACTION_LABELS[showNotesModal] || showNotesModal}
            </h3>
            <p className="mt-1 text-sm text-gray-500">Add optional notes for this transition.</p>
            <textarea
              value={transitionNotes}
              onChange={(e) => setTransitionNotes(e.target.value)}
              rows={3}
              maxLength={2000}
              className="mt-3 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Optional notes..."
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNotesModal(null);
                  setTransitionNotes("");
                }}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleTransition(showNotesModal)}
                disabled={isTransitioning}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isTransitioning ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-gray-900">Transition Timeline</h3>
        {transitions.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No transitions yet. Case was just reported.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {transitions.map((transition, index) => (
              <div key={transition.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                    <Clock className="h-3 w-3 text-blue-600" />
                  </div>
                  {index < transitions.length - 1 && <div className="h-full w-px bg-gray-200" />}
                </div>
                <div className="pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {formatStatus(transition.fromStatus || "NEW")}
                    </span>
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{formatStatus(transition.toStatus)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{formatDate(transition.createdAt)}</p>
                  {transition.notes && <p className="mt-1 text-sm text-gray-600">{transition.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
