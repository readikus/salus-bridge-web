import { z } from "zod";

/**
 * Analytics query parameters schema.
 * Validates period, departmentId, and groupBy for analytics API routes.
 */
export const analyticsQuerySchema = z.object({
  period: z.enum(["3m", "6m", "12m"]).default("12m"),
  departmentId: z.string().uuid().optional(),
  groupBy: z.enum(["team", "department", "organisation"]).default("department"),
});

export type AnalyticsQueryParams = z.infer<typeof analyticsQuerySchema>;

/**
 * Export format schema for analytics export endpoint.
 */
export const analyticsExportSchema = analyticsQuerySchema.extend({
  format: z.enum(["csv", "pdf"]),
});

export type AnalyticsExportParams = z.infer<typeof analyticsExportSchema>;

/**
 * Map period strings to number of months.
 */
export function periodToMonths(period: string): number {
  switch (period) {
    case "3m":
      return 3;
    case "6m":
      return 6;
    case "12m":
    default:
      return 12;
  }
}
