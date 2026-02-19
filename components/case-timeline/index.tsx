"use client";

import { useState, useEffect } from "react";
import { fetchCaseTimeline } from "@/actions/sickness-cases";
import { CaseTimelineEntry } from "@/providers/services/milestone.service";
import { CheckCircle2, Clock, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  caseId: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusIcon({ status }: { status: CaseTimelineEntry["status"] }) {
  switch (status) {
    case "PASSED":
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "DUE_TODAY":
      return <Clock className="h-5 w-5 animate-pulse text-amber-500" />;
    case "UPCOMING":
      return <Circle className="h-5 w-5 text-gray-300" />;
  }
}

function StatusBadge({ status }: { status: CaseTimelineEntry["status"] }) {
  switch (status) {
    case "PASSED":
      return (
        <Badge variant="secondary" className="bg-green-50 text-green-700">
          Passed
        </Badge>
      );
    case "DUE_TODAY":
      return (
        <Badge variant="secondary" className="bg-amber-50 text-amber-700">
          Due Today
        </Badge>
      );
    case "UPCOMING":
      return (
        <Badge variant="secondary" className="bg-gray-50 text-gray-500">
          Upcoming
        </Badge>
      );
  }
}

export function CaseTimeline({ caseId }: Props) {
  const [timeline, setTimeline] = useState<CaseTimelineEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState<string | null>(null);

  useEffect(() => {
    fetchCaseTimeline(caseId)
      .then((res) => setTimeline(res.timeline))
      .catch((err: any) => setHasError(err.message))
      .finally(() => setIsLoading(false));
  }, [caseId]);

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

  return (
    <div className="relative">
      {/* Vertical connecting line */}
      <div className="absolute left-[9px] top-3 bottom-3 w-px bg-gray-200" />

      <div className="space-y-4">
        {timeline.map((entry) => (
          <div key={entry.milestone.milestoneKey} className="relative flex gap-4 pl-0">
            {/* Status icon */}
            <div className="relative z-10 flex-shrink-0 bg-white py-0.5">
              <StatusIcon status={entry.status} />
            </div>

            {/* Content */}
            <div className={`flex-1 pb-2 ${entry.status === "PASSED" ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium ${
                    entry.status === "DUE_TODAY" ? "text-amber-700" : entry.status === "PASSED" ? "text-gray-500" : "text-gray-900"
                  }`}
                >
                  {entry.milestone.label}
                </span>
                <StatusBadge status={entry.status} />
              </div>

              <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                <span>Day {entry.daysSinceStart}</span>
                <span>{formatDate(entry.dueDate)}</span>
              </div>

              {entry.milestone.description && (
                <p className="mt-1 text-xs text-gray-400">{entry.milestone.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
