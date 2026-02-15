"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Check, X, BookOpen, CheckCircle2 } from "lucide-react";
import { fetchGuidance, fetchTrackEngagement, GuidanceResponse } from "@/actions/guidance";
import { GuidanceStep } from "@/constants/guidance-content";

interface Props {
  caseId: string;
}

const TYPE_LABELS: Record<string, string> = {
  initial_contact: "Initial Contact",
  check_in: "Check-in",
  rtw_meeting: "RTW Meeting",
};

const TYPE_COLOURS: Record<string, string> = {
  initial_contact: "bg-blue-100 text-blue-700",
  check_in: "bg-amber-100 text-amber-700",
  rtw_meeting: "bg-green-100 text-green-700",
};

/**
 * Guidance panel -- shows step-by-step conversation guidance for managers.
 * Displays the appropriate script for the case state and tracks engagement.
 */
export function GuidancePanel({ caseId }: Props) {
  const [data, setData] = useState<GuidanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [expandedRationale, setExpandedRationale] = useState<Set<string>>(new Set());
  const [engagedSteps, setEngagedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchGuidance(caseId)
      .then((response) => {
        setData(response);
        setEngagedSteps(new Set(response.engagedSteps));
      })
      .catch((err: any) => {
        setHasError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [caseId]);

  const handleToggleStep = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
        // Track engagement when expanding a step
        if (data?.script && !engagedSteps.has(stepId)) {
          handleTrackEngagement(stepId);
        }
      }
      return next;
    });
  };

  const handleToggleRationale = (stepId: string) => {
    setExpandedRationale((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const handleTrackEngagement = async (stepId: string) => {
    if (!data?.script || engagedSteps.has(stepId)) return;

    try {
      await fetchTrackEngagement(caseId, data.script.type, stepId);
      setEngagedSteps((prev) => new Set([...prev, stepId]));
    } catch {
      // Silently handle -- engagement tracking is non-critical
    }
  };

  const handleMarkReviewed = (stepId: string) => {
    handleTrackEngagement(stepId);
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">Loading guidance...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-700">{hasError}</p>
      </div>
    );
  }

  if (!data?.script) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2 text-gray-400">
          <BookOpen className="h-5 w-5" />
          <p className="text-sm">No guidance available for the current case state.</p>
        </div>
      </div>
    );
  }

  const { script } = data;
  const totalSteps = script.steps.length;
  const reviewedCount = script.steps.filter((s) => engagedSteps.has(s.id)).length;

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-4">
        <div className="mb-2 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h2 className="text-sm font-semibold text-gray-900">Manager Guidance</h2>
        </div>
        <div className="mb-2 flex items-center gap-2">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLOURS[script.type] || "bg-gray-100 text-gray-700"}`}>
            {TYPE_LABELS[script.type] || script.type}
          </span>
          <span className="text-xs text-gray-500">{script.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-gray-200">
            <div
              className="h-1.5 rounded-full bg-blue-600 transition-all"
              style={{ width: `${totalSteps > 0 ? (reviewedCount / totalSteps) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">
            {reviewedCount} of {totalSteps} steps reviewed
          </span>
        </div>
      </div>

      {/* Steps */}
      <div className="divide-y divide-gray-100">
        {script.steps.map((step, index) => (
          <GuidanceStepCard
            key={step.id}
            step={step}
            index={index}
            isExpanded={expandedSteps.has(step.id)}
            isRationaleExpanded={expandedRationale.has(step.id)}
            isEngaged={engagedSteps.has(step.id)}
            onToggle={() => handleToggleStep(step.id)}
            onToggleRationale={() => handleToggleRationale(step.id)}
            onMarkReviewed={() => handleMarkReviewed(step.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface StepCardProps {
  step: GuidanceStep;
  index: number;
  isExpanded: boolean;
  isRationaleExpanded: boolean;
  isEngaged: boolean;
  onToggle: () => void;
  onToggleRationale: () => void;
  onMarkReviewed: () => void;
}

function GuidanceStepCard({
  step,
  index,
  isExpanded,
  isRationaleExpanded,
  isEngaged,
  onToggle,
  onToggleRationale,
  onMarkReviewed,
}: StepCardProps) {
  return (
    <div className="px-4 py-3">
      {/* Step header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 text-left"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
        )}
        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
          {index + 1}
        </span>
        <span className="flex-1 text-sm font-medium text-gray-900">{step.title}</span>
        {isEngaged && <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="ml-11 mt-3 space-y-3">
          {/* Prompt */}
          <div className="rounded-md border-l-4 border-blue-300 bg-blue-50 px-3 py-2">
            <p className="text-xs font-medium text-blue-700">What to say:</p>
            <p className="mt-1 text-sm italic text-blue-900">{step.prompt}</p>
          </div>

          {/* Rationale (collapsed) */}
          <button
            onClick={onToggleRationale}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            {isRationaleExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Why this matters
          </button>
          {isRationaleExpanded && (
            <p className="text-xs text-gray-600">{step.rationale}</p>
          )}

          {/* Do / Don't lists */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium text-green-700">Do</p>
              <ul className="space-y-1">
                {step.doList.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                    <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-red-700">Don't</p>
              <ul className="space-y-1">
                {step.dontList.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                    <X className="mt-0.5 h-3 w-3 flex-shrink-0 text-red-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mark as reviewed */}
          {!isEngaged && (
            <button
              onClick={onMarkReviewed}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mark as reviewed
            </button>
          )}
        </div>
      )}
    </div>
  );
}
