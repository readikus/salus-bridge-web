import { z } from "zod";

export const createMilestoneConfigSchema = z.object({
  milestoneKey: z.string().min(1).max(50),
  label: z.string().min(3).max(100),
  dayOffset: z.number().int().min(1, "Day offset must be at least 1"),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const updateMilestoneConfigSchema = z.object({
  label: z.string().min(3).max(100).optional(),
  dayOffset: z.number().int().min(1).optional(),
  description: z.string().max(500).nullish(),
  isActive: z.boolean().optional(),
});

export type CreateMilestoneConfigInput = z.infer<typeof createMilestoneConfigSchema>;
export type UpdateMilestoneConfigInput = z.infer<typeof updateMilestoneConfigSchema>;
