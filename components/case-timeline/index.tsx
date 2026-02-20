"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchCaseTimeline, fetchTransitionCase } from "@/actions/sickness-cases";
import { fetchMilestoneActions, fetchUpdateMilestoneAction, fetchMilestoneGuidance } from "@/actions/milestone-actions";
import { CaseTimelineEntry } from "@/providers/services/milestone.service";
import { MilestoneAction, MilestoneGuidanceContent, SicknessCase } from "@/types/database";
import { MILESTONE_TRANSITIONS } from "@/constants/milestone-transitions";
import { SicknessAction, VALID_TRANSITIONS, SicknessState } from "@/constants/sickness-states";
import {
  AlertCircle,
  Clock,
  Circle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Loader2,
  Undo2,
  Save,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  caseId: string;
  sicknessCase: SicknessCase;
  canManage: boolean;
  onCaseTransition?: () => void;
}

export type { CaseTimelineEntry } from "@/providers/services/milestone.service";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(dateStr: string | Date | null): string {
  if (!dateStr) return "---";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

const ACTION_LABELS: Record<string, string> = {
  [SicknessAction.ACKNOWLEDGE]: "Acknowledge",
  [SicknessAction.RECEIVE_FIT_NOTE]: "Receive Fit Note",
  [SicknessAction.SCHEDULE_RTW]: "Schedule RTW Meeting",
  [SicknessAction.COMPLETE_RTW]: "Complete RTW Meeting",
  [SicknessAction.CLOSE_CASE]: "Close Case",
  [SicknessAction.REOPEN]: "Reopen Case",
};

/** Determine if a workflow transition is valid for the current case status */
function isTransitionAvailable(caseStatus: string, action: SicknessAction): boolean {
  const transitions = VALID_TRANSITIONS[caseStatus as SicknessState];
  return !!transitions && action in transitions;
}

// ─── Milestone Card ───────────────────────────────────────────────────────────

interface MilestoneCardProps {
  entry: CaseTimelineEntry;
  action?: MilestoneAction;
  guidance?: MilestoneGuidanceContent;
  employeeName?: string;
  showEmployeeView: boolean;
  canManage: boolean;
  caseStatus: string;
  caseId: string;
  onActionUpdated: () => void;
  onCaseTransition?: () => void;
}

function MilestoneCard({
  entry,
  action,
  guidance,
  employeeName,
  showEmployeeView,
  canManage,
  caseStatus,
  caseId,
  onActionUpdated,
  onCaseTransition,
}: MilestoneCardProps) {
  const isCompleted = action?.status === "COMPLETED";
  const isActionable = (entry.status === "OVERDUE" || entry.status === "DUE_TODAY") && !isCompleted;

  const [isExpanded, setIsExpanded] = useState(isActionable);
  const [showSuggestedText, setShowSuggestedText] = useState(false);
  const [actionStatus, setActionStatus] = useState<"IN_PROGRESS" | "COMPLETED">(
    action?.status === "IN_PROGRESS" ? "IN_PROGRESS" : "COMPLETED",
  );
  const [actionDate, setActionDate] = useState(todayStr());
  const [actionNotes, setActionNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const milestoneKey = entry.milestone.milestoneKey;
  const mappedTransition = MILESTONE_TRANSITIONS[milestoneKey];
  const transitionAvailable = mappedTransition ? isTransitionAvailable(caseStatus, mappedTransition) : false;

  // Icon and accent
  let icon: React.ReactNode;
  let accentClass: string;
  let badgeNode: React.ReactNode;

  if (isCompleted) {
    icon = <CheckCircle2 className="h-5 w-5 text-green-500" />;
    accentClass = "border-l-green-500";
    badgeNode = (
      <Badge variant="secondary" className="bg-green-50 text-green-700">
        Completed
      </Badge>
    );
  } else if (entry.status === "OVERDUE") {
    icon = <AlertCircle className="h-5 w-5 text-red-500" />;
    accentClass = "border-l-red-500";
    badgeNode = (
      <Badge variant="secondary" className="bg-red-50 text-red-700">
        Overdue
      </Badge>
    );
  } else if (entry.status === "DUE_TODAY") {
    icon = <Clock className="h-5 w-5 animate-pulse text-amber-500" />;
    accentClass = "border-l-amber-500";
    badgeNode = (
      <Badge variant="secondary" className="bg-amber-50 text-amber-700">
        Due Today
      </Badge>
    );
  } else {
    icon = <Circle className="h-5 w-5 text-gray-300" />;
    accentClass = "border-l-gray-200";
    badgeNode = (
      <Badge variant="secondary" className="bg-gray-50 text-gray-500">
        Upcoming
      </Badge>
    );
  }

  const suggestedText =
    guidance && employeeName ? guidance.suggestedText.replace(/\[name\]/g, employeeName) : guidance?.suggestedText;

  const handleSaveAction = async () => {
    if (!action) return;
    try {
      setIsSaving(true);
      setSaveError(null);
      await fetchUpdateMilestoneAction(action.id, {
        status: actionStatus,
        notes: actionNotes || undefined,
        completedAt: actionStatus === "COMPLETED" ? actionDate : undefined,
      });

      // Auto-trigger the mapped workflow transition when completing
      if (actionStatus === "COMPLETED" && transitionAvailable && mappedTransition) {
        await fetchTransitionCase(caseId, mappedTransition, actionNotes || undefined);
        onCaseTransition?.();
      }

      onActionUpdated();
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUndo = async () => {
    if (!action) return;
    try {
      setIsSaving(true);
      setSaveError(null);
      await fetchUpdateMilestoneAction(action.id, { status: "PENDING" });
      setIsExpanded(true);
      onActionUpdated();
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`rounded-lg border border-gray-200 border-l-4 ${accentClass} bg-white`}>
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">{icon}</div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {entry.milestone.label}
              </span>
              {badgeNode}
            </div>
            <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
              <span>{entry.milestone.label}</span>
              <span>Day {entry.daysSinceStart}</span>
              <span>{formatDate(entry.dueDate)}</span>
              {isCompleted && action?.completedAt && (
                <span className="text-green-600">Done {formatDateTime(action.completedAt)}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 text-gray-400">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Completed summary — always visible without expanding */}
      {isCompleted && canManage && (
        <div className="border-t border-gray-100 px-5 py-3 space-y-2">
          {action?.notes && (
            <div className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
              <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
              {action.notes}
            </div>
          )}
          {saveError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {saveError}
            </div>
          )}
          <button
            onClick={handleUndo}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Undo2 className="h-3.5 w-3.5" />}
            Undo
          </button>
        </div>
      )}

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-3">
          {/* Guidance text */}
          {guidance && (
            <>
              <p className="text-sm text-gray-600">{guidance.managerGuidance}</p>

              {/* Suggested text toggle */}
              <div>
                <button
                  onClick={() => setShowSuggestedText(!showSuggestedText)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  {showSuggestedText ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  Suggested text
                </button>
                {showSuggestedText && (
                  <div className="mt-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm text-gray-700 italic">
                    {suggestedText}
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div>
                <p className="text-xs font-medium text-gray-500">Steps</p>
                <ol className="mt-1 list-inside list-decimal space-y-0.5 text-xs text-gray-600">
                  {guidance.instructions.map((instruction, i) => (
                    <li key={i}>{instruction}</li>
                  ))}
                </ol>
              </div>

              {/* Employee view */}
              {showEmployeeView && (
                <div className="rounded-md border border-blue-200 bg-blue-50/50 px-3 py-2.5">
                  <p className="text-xs font-medium text-blue-700">Employee perspective</p>
                  <p className="mt-1 text-xs text-blue-600">{guidance.employeeView}</p>
                </div>
              )}
            </>
          )}

          {/* Action controls for actionable cards */}
          {isActionable && canManage && action && (
            <div className="space-y-3 rounded-md border border-gray-100 bg-gray-50 p-4">
              {saveError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {saveError}
                </div>
              )}

              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select
                    value={actionStatus}
                    onChange={(e) => setActionStatus(e.target.value as "IN_PROGRESS" | "COMPLETED")}
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Complete</option>
                  </select>
                </div>

                {actionStatus === "COMPLETED" && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date completed</label>
                    <input
                      type="date"
                      value={actionDate}
                      onChange={(e) => setActionDate(e.target.value)}
                      className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={2}
                  maxLength={2000}
                  placeholder="Optional notes..."
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleSaveAction}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ─── Main CaseTimeline Component ──────────────────────────────────────────────

export function CaseTimeline({ caseId, sicknessCase, canManage, onCaseTransition }: Props) {
  const [timeline, setTimeline] = useState<CaseTimelineEntry[]>([]);
  const [actions, setActions] = useState<MilestoneAction[]>([]);
  const [guidanceMap, setGuidanceMap] = useState<Record<string, MilestoneGuidanceContent>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState<string | null>(null);
  const [showEmployeeView, setShowEmployeeView] = useState(false);

  const employeeName =
    [sicknessCase.employeeFirstName, sicknessCase.employeeLastName].filter(Boolean).join(" ") || undefined;

  const loadData = useCallback(async () => {
    try {
      setHasError(null);
      const [timelineRes, actionsRes, guidanceRes] = await Promise.all([
        fetchCaseTimeline(caseId),
        fetchMilestoneActions(caseId),
        fetchMilestoneGuidance(caseId),
      ]);
      setTimeline(timelineRes.timeline);
      setActions(actionsRes.actions);
      setGuidanceMap(guidanceRes.guidance);
    } catch (err: any) {
      setHasError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading timeline...</p>;
  }

  if (hasError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{hasError}</div>
    );
  }

  if (timeline.length === 0) {
    return <p className="text-sm text-gray-500">No milestones configured for this case.</p>;
  }

  // Build a map of milestoneKey -> action for quick lookup
  const actionMap = new Map<string, MilestoneAction>();
  for (const a of actions) {
    actionMap.set(a.milestoneKey, a);
  }

  // Count actionable items
  const actionableCount = timeline.filter((entry) => {
    const action = actionMap.get(entry.milestone.milestoneKey);
    return (entry.status === "OVERDUE" || entry.status === "DUE_TODAY") && action?.status !== "COMPLETED";
  }).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Milestone Timeline</h2>
          {actionableCount > 0 && (
            <Badge variant="secondary" className="bg-red-50 text-red-700">
              {actionableCount} action{actionableCount !== 1 ? "s" : ""} required
            </Badge>
          )}
        </div>
        <button
          onClick={() => setShowEmployeeView(!showEmployeeView)}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          {showEmployeeView ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showEmployeeView ? "Hide employee view" : "View as employee"}
        </button>
      </div>

      <div className="space-y-3">
        {timeline.map((entry) => (
          <MilestoneCard
            key={entry.milestone.milestoneKey}
            entry={entry}
            action={actionMap.get(entry.milestone.milestoneKey)}
            guidance={guidanceMap[entry.milestone.milestoneKey]}
            employeeName={employeeName}
            showEmployeeView={showEmployeeView}
            canManage={canManage}
            caseStatus={sicknessCase.status}
            caseId={caseId}
            onActionUpdated={loadData}
            onCaseTransition={onCaseTransition}
          />
        ))}
      </div>
    </div>
  );
}
