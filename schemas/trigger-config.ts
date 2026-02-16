import { z } from "zod";

export const TriggerType = {
  FREQUENCY: "FREQUENCY",
  BRADFORD_FACTOR: "BRADFORD_FACTOR",
  DURATION: "DURATION",
} as const;

export type TriggerTypeValue = (typeof TriggerType)[keyof typeof TriggerType];

export const createTriggerConfigSchema = z
  .object({
    name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name must be at most 100 characters"),
    triggerType: z.enum([TriggerType.FREQUENCY, TriggerType.BRADFORD_FACTOR, TriggerType.DURATION]),
    thresholdValue: z.number().int().min(1, "Threshold must be at least 1"),
    periodDays: z.number().int().min(1, "Period must be at least 1 day").optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // periodDays is required for FREQUENCY and DURATION types
      if (data.triggerType === TriggerType.FREQUENCY || data.triggerType === TriggerType.DURATION) {
        return data.periodDays !== undefined && data.periodDays !== null;
      }
      return true;
    },
    {
      message: "Period (days) is required for Frequency and Duration trigger types",
      path: ["periodDays"],
    },
  );

export const updateTriggerConfigSchema = z
  .object({
    name: z.string().min(3).max(100).optional(),
    triggerType: z.enum([TriggerType.FREQUENCY, TriggerType.BRADFORD_FACTOR, TriggerType.DURATION]).optional(),
    thresholdValue: z.number().int().min(1).optional(),
    periodDays: z.number().int().min(1).nullish(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // If triggerType is explicitly set to FREQUENCY or DURATION, periodDays must be provided
      if (
        (data.triggerType === TriggerType.FREQUENCY || data.triggerType === TriggerType.DURATION) &&
        data.periodDays === undefined
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Period (days) is required for Frequency and Duration trigger types",
      path: ["periodDays"],
    },
  );

export type CreateTriggerConfigInput = z.infer<typeof createTriggerConfigSchema>;
export type UpdateTriggerConfigInput = z.infer<typeof updateTriggerConfigSchema>;
