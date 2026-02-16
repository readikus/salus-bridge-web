/**
 * Bradford Factor configuration and risk levels.
 * Formula: S * S * D (where S = spell count, D = total days lost)
 * Standard lookback period: 52 weeks (rolling year)
 */

export const BRADFORD_LOOKBACK_WEEKS = 52;

export const BRADFORD_RISK_LEVELS = [
  { min: 0, max: 49, label: "Low", color: "green" },
  { min: 50, max: 199, label: "Medium", color: "amber" },
  { min: 200, max: 499, label: "High", color: "orange" },
  { min: 500, max: Infinity, label: "Critical", color: "red" },
] as const;

export type BradfordRiskLevel = (typeof BRADFORD_RISK_LEVELS)[number];

/**
 * Get the risk level for a Bradford Factor score.
 */
export function getBradfordRiskLevel(score: number): BradfordRiskLevel {
  const level = BRADFORD_RISK_LEVELS.find((l) => score >= l.min && score <= l.max);
  return level || BRADFORD_RISK_LEVELS[BRADFORD_RISK_LEVELS.length - 1];
}
