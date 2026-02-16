import { getBradfordRiskLevel } from "@/constants/bradford-factor";
import { cn } from "@/utils/cn";

interface Props {
  score: number;
  showLabel?: boolean;
}

const COLOR_CLASSES: Record<string, string> = {
  green: "bg-green-100 text-green-800",
  amber: "bg-amber-100 text-amber-800",
  orange: "bg-orange-100 text-orange-800",
  red: "bg-red-100 text-red-800",
};

export function BradfordFactorBadge({ score, showLabel = true }: Props) {
  const riskLevel = getBradfordRiskLevel(score);
  const colorClass = COLOR_CLASSES[riskLevel.color] || COLOR_CLASSES.green;

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", colorClass)}>
      {score}
      {showLabel && <span>({riskLevel.label})</span>}
    </span>
  );
}
