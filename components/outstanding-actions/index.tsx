import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { MilestoneActionWithDetails } from "@/types/database";

interface Props {
  actions: (MilestoneActionWithDetails & { caseId: string })[];
}

function getBadge(dueDate: Date): { label: string; className: string } | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDate);
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  if (dueDay < today) {
    return { label: "Overdue", className: "text-red-600 bg-red-50" };
  }

  const twoDaysFromNow = new Date(today);
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

  if (dueDay <= twoDaysFromNow) {
    return { label: "Due soon", className: "text-amber-600 bg-amber-50" };
  }

  return null;
}

export function OutstandingActions({ actions }: Props) {
  if (actions.length === 0) {
    return <p className="text-xs text-gray-500">No actions required</p>;
  }

  return (
    <div className="max-h-64 overflow-y-auto">
      {actions.map((action) => {
        const badge = getBadge(new Date(action.dueDate));
        const employeeName =
          action.employeeFirstName || action.employeeLastName
            ? `${action.employeeFirstName ?? ""} ${action.employeeLastName ?? ""}`.trim()
            : "Unknown employee";

        return (
          <Link
            key={action.id}
            href={`/sickness/${action.caseId}`}
            className="flex items-center justify-between border-b py-2 last:border-b-0 hover:bg-gray-50 transition px-1"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{employeeName}</p>
              <p className="text-xs text-gray-500 truncate">{action.milestoneLabel}</p>
            </div>
            <div className="ml-3 flex items-center gap-2 shrink-0">
              {badge && (
                <span className={`flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${badge.className}`}>
                  {badge.label === "Overdue" && <AlertCircle className="h-3 w-3" />}
                  {badge.label}
                </span>
              )}
              <span className="text-xs text-gray-400">{new Date(action.dueDate).toLocaleDateString("en-GB")}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
