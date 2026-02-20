"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CaseTimelineEntry } from "@/providers/services/milestone.service";
import { MILESTONE_GUIDANCE, MilestoneGuidance } from "@/constants/milestone-guidance";

interface Props {
  timeline: CaseTimelineEntry[];
  employeeName?: string;
}

function StatusBadge({ status }: { status: CaseTimelineEntry["status"] }) {
  if (status === "OVERDUE") {
    return (
      <Badge variant="secondary" className="bg-red-50 text-red-700">
        Overdue
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="bg-amber-50 text-amber-700">
      Due Today
    </Badge>
  );
}

function ActionCard({
  entry,
  guidance,
  employeeName,
  showEmployeeView,
}: {
  entry: CaseTimelineEntry;
  guidance: MilestoneGuidance;
  employeeName?: string;
  showEmployeeView: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const accentColor = entry.status === "OVERDUE" ? "border-l-red-500" : "border-l-amber-500";

  const suggestedText = employeeName
    ? guidance.suggestedText.replace(/\[name\]/g, employeeName)
    : guidance.suggestedText;

  return (
    <div className={`rounded-lg border border-gray-200 border-l-4 ${accentColor} bg-white p-5`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-gray-900">{guidance.actionTitle}</h4>
          <StatusBadge status={entry.status} />
        </div>
        <span className="text-xs text-gray-400">{entry.milestone.label}</span>
      </div>

      <p className="mt-2 text-sm text-gray-600">{guidance.managerGuidance}</p>

      {/* Expandable suggested text */}
      <div className="mt-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          Suggested text
        </button>
        {isExpanded && (
          <div className="mt-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm text-gray-700 italic">
            {suggestedText}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-3">
        <p className="text-xs font-medium text-gray-500">Steps</p>
        <ol className="mt-1 list-inside list-decimal space-y-0.5 text-xs text-gray-600">
          {guidance.instructions.map((instruction, i) => (
            <li key={i}>{instruction}</li>
          ))}
        </ol>
      </div>

      {/* Employee view */}
      {showEmployeeView && (
        <div className="mt-3 rounded-md border border-blue-200 bg-blue-50/50 px-3 py-2.5">
          <p className="text-xs font-medium text-blue-700">Employee perspective</p>
          <p className="mt-1 text-xs text-blue-600">{guidance.employeeView}</p>
        </div>
      )}
    </div>
  );
}

export function MilestoneActionCards({ timeline, employeeName }: Props) {
  const [showEmployeeView, setShowEmployeeView] = useState(false);

  const actionableEntries = timeline.filter(
    (entry) => (entry.status === "OVERDUE" || entry.status === "DUE_TODAY") && MILESTONE_GUIDANCE[entry.milestone.milestoneKey],
  );

  if (actionableEntries.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Actions Required</h2>
          <Badge variant="secondary" className="bg-red-50 text-red-700">
            {actionableEntries.length}
          </Badge>
        </div>
        <button
          onClick={() => setShowEmployeeView(!showEmployeeView)}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          {showEmployeeView ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showEmployeeView ? "Hide employee view" : "View as employee"}
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {actionableEntries.map((entry) => (
          <ActionCard
            key={entry.milestone.milestoneKey}
            entry={entry}
            guidance={MILESTONE_GUIDANCE[entry.milestone.milestoneKey]}
            employeeName={employeeName}
            showEmployeeView={showEmployeeView}
          />
        ))}
      </div>
    </div>
  );
}
