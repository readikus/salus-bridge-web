import { z } from "zod";

export const createRtwMeetingSchema = z.object({
  scheduledDate: z.string().datetime(),
  questionnaireResponses: z.record(z.string(), z.any()).optional(),
  outcomes: z.string().max(5000).optional(),
  adjustments: z
    .array(
      z.object({
        type: z.string(),
        description: z.string(),
        reviewDate: z.string().optional(),
      }),
    )
    .default([]),
});

export type CreateRtwMeetingInput = z.infer<typeof createRtwMeetingSchema>;
