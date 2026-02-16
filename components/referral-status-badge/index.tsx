import { cn } from "@/utils/cn";
import { ReferralStatus, REFERRAL_STATUS_LABELS } from "@/constants/referral-statuses";

interface Props {
  status: ReferralStatus | string;
}

const STATUS_STYLES: Record<string, string> = {
  [ReferralStatus.SUBMITTED]:
    "border-transparent bg-blue-100 text-blue-800",
  [ReferralStatus.IN_PROGRESS]:
    "border-transparent bg-amber-100 text-amber-800",
  [ReferralStatus.REPORT_RECEIVED]:
    "border-transparent bg-green-100 text-green-800",
  [ReferralStatus.CLOSED]:
    "border-transparent bg-gray-100 text-gray-800",
};

export function ReferralStatusBadge({ status }: Props) {
  const label = REFERRAL_STATUS_LABELS[status as ReferralStatus] || status;
  const style = STATUS_STYLES[status] || "border-transparent bg-gray-100 text-gray-800";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        style,
      )}
    >
      {label}
    </span>
  );
}
