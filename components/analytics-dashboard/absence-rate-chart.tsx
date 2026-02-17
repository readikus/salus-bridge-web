"use client";

import { CohortGuard } from "./cohort-guard";

interface AbsenceRateItem {
  groupName: string;
  employeeCount: number;
  absenceCount?: number;
  absenceRate?: number;
  totalDaysLost?: number;
  suppressed?: boolean;
  reason?: string;
}

interface Props {
  data: AbsenceRateItem[];
}

/**
 * AbsenceRateChart -- horizontal bar chart showing absence rate per group.
 * Color coding: green < 5%, amber 5-10%, red > 10%.
 * Groups with suppressed data are wrapped in CohortGuard.
 */
export function AbsenceRateChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-500">No absence data available for this period.</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <CohortGuard
          key={item.groupName}
          suppressed={!!item.suppressed}
          reason={item.reason || "Fewer than 5 employees in this group"}
        >
          <div className="flex items-center gap-3">
            <div className="w-40 shrink-0 truncate text-sm font-medium text-gray-700" title={item.groupName}>
              {item.groupName}
            </div>
            <div className="flex-1">
              <div className="relative h-7 w-full overflow-hidden rounded bg-gray-100">
                <div
                  className={`absolute inset-y-0 left-0 rounded transition-all ${getBarColor(item.absenceRate ?? 0)}`}
                  style={{ width: `${Math.min(item.absenceRate ?? 0, 100)}%` }}
                />
              </div>
            </div>
            <div className="w-20 shrink-0 text-right text-sm">
              <span className="font-semibold">{item.absenceRate ?? 0}%</span>
              <span className="ml-1 text-xs text-gray-500">({item.absenceCount ?? 0})</span>
            </div>
          </div>
          <div className="ml-40 pl-3 text-xs text-gray-500">
            {item.employeeCount} employees, {item.totalDaysLost ?? 0} days lost
          </div>
        </CohortGuard>
      ))}
    </div>
  );
}

function getBarColor(rate: number): string {
  if (rate > 10) return "bg-red-400";
  if (rate >= 5) return "bg-amber-400";
  return "bg-green-400";
}
