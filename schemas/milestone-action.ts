import { z } from "zod";

/**
 * Schema for completing a milestone action.
 */
export const completeMilestoneActionSchema = z.object({
  notes: z.string().optional(),
});

/**
 * Schema for skipping a milestone action.
 * Reason is required when skipping.
 */
export const skipMilestoneActionSchema = z.object({
  notes: z.string().min(1, "Reason required when skipping"),
});

export type CompleteMilestoneActionInput = z.infer<typeof completeMilestoneActionSchema>;
export type SkipMilestoneActionInput = z.infer<typeof skipMilestoneActionSchema>;
