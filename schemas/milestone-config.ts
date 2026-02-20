import { z } from "zod";

export const milestoneGuidanceSchema = z.object({
  actionTitle: z.string().min(1).max(200),
  managerGuidance: z.string().min(1).max(5000),
  suggestedText: z.string().min(1).max(5000),
  instructions: z.array(z.string().min(1)).min(1).max(20),
  employeeView: z.string().min(1).max(5000),
});

export const createMilestoneConfigSchema = z.object({
  milestoneKey: z.string().min(1).max(50),
  label: z.string().min(3).max(100),
  dayOffset: z.number().int().min(1, "Day offset must be at least 1"),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  guidance: milestoneGuidanceSchema.optional(),
});

export const updateMilestoneConfigSchema = z.object({
  label: z.string().min(3).max(100).optional(),
  dayOffset: z.number().int().min(1).optional(),
  description: z.string().max(500).nullish(),
  isActive: z.boolean().optional(),
  guidance: milestoneGuidanceSchema.optional(),
});

export type MilestoneGuidanceInput = z.infer<typeof milestoneGuidanceSchema>;
export type CreateMilestoneConfigInput = z.infer<typeof createMilestoneConfigSchema>;
export type UpdateMilestoneConfigInput = z.infer<typeof updateMilestoneConfigSchema>;
