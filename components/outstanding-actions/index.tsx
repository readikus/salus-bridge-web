import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { MilestoneActionWithDetails } from "@/types/database";

interface Props {
  actions: (MilestoneActionWithDetails & { caseId: string })[];
}

interface GroupedCase {
  caseId: string;
  employeeName: string;
  /** Most urgent action (earliest due date) */
  primaryAction: MilestoneActionWithDetails & { caseId: string };
  totalActions: number;
  overdueCount: number;
}

function groupByCaseId(actions: Props["actions"]): GroupedCase[] {
  const map = new Map<string, GroupedCase>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const action of actions) {
    const existing = map.get(action.caseId);
    const due = new Date(action.dueDate);
    due.setHours(0, 0, 0, 0);
    const isOverdue = due < today;

    if (!existing) {
      const employeeName =
        action.employeeFirstName || action.employeeLastName
          ? `${action.employeeFirstName ?? ""} ${action.employeeLastName ?? ""}`.trim()
          : "Unknown employee";

      map.set(action.caseId, {
        caseId: action.caseId,
        employeeName,
        primaryAction: action,
        totalActions: 1,
        overdueCount: isOverdue ? 1 : 0,
      });
    } else {
      existing.totalActions++;
      if (isOverdue) existing.overdueCount++;
    }
  }

  // Sort by overdue count desc, then total actions desc
  return Array.from(map.values()).sort((a, b) => b.overdueCount - a.overdueCount || b.totalActions - a.totalActions);
}

export function OutstandingActions({ actions }: Props) {
  if (actions.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-sm text-gray-500">No actions required right now.</p>
      </div>
    );
  }

  const grouped = groupByCaseId(actions);
  const topCase = grouped[0];

  return (
    <div className="space-y-3">
      {/* Primary CTA — the most urgent case */}
      <Link
        href={`/sickness/${topCase.caseId}`}
        className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 transition hover:bg-blue-100"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-blue-900">{topCase.employeeName}</p>
          <p className="text-xs text-blue-700">
            {topCase.primaryAction.milestoneLabel}
            {topCase.totalActions > 1 && (
              <span className="text-blue-500">
                {" "}
                + {topCase.totalActions - 1} other action{topCase.totalActions - 1 !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <div className="ml-3 flex items-center gap-2 shrink-0">
          {topCase.overdueCount > 0 && (
            <span className="flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-600">
              <AlertCircle className="h-3 w-3" />
              {topCase.overdueCount} overdue
            </span>
          )}
          <ArrowRight className="h-4 w-4 text-blue-600" />
        </div>
      </Link>

      {/* Remaining cases */}
      {grouped.length > 1 && (
        <div className="max-h-48 overflow-y-auto">
          {grouped.slice(1).map((group) => (
            <Link
              key={group.caseId}
              href={`/sickness/${group.caseId}`}
              className="flex items-center justify-between border-b py-2 last:border-b-0 hover:bg-gray-50 transition px-1"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{group.employeeName}</p>
                <p className="text-xs text-gray-500 truncate">
                  {group.primaryAction.milestoneLabel}
                  {group.totalActions > 1 && (
                    <span className="text-gray-400">
                      {" "}
                      + {group.totalActions - 1} other{group.totalActions - 1 !== 1 ? "s" : ""}
                    </span>
                  )}
                </p>
              </div>
              <div className="ml-3 flex items-center gap-2 shrink-0">
                {group.overdueCount > 0 && (
                  <span className="flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {group.overdueCount}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
