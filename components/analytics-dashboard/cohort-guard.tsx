import { Lock } from "lucide-react";
import { ReactNode } from "react";

interface Props {
  suppressed: boolean;
  reason: string;
  children: ReactNode;
}

/**
 * CohortGuard -- privacy enforcement UI component.
 * Suppresses data display for groups with fewer than 5 employees (ANAL-04).
 * Renders a muted card with lock icon when data is suppressed.
 */
export function CohortGuard({ suppressed, reason, children }: Props) {
  if (suppressed) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500">
        <Lock className="h-4 w-4 shrink-0" />
        <span>Data suppressed: {reason.toLowerCase()}</span>
      </div>
    );
  }

  return <>{children}</>;
}
