import { z } from "zod";

export const createFitNoteSchema = z.object({
  fitNoteStatus: z.enum(["NOT_FIT", "MAY_BE_FIT"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a valid date (YYYY-MM-DD)"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a valid date (YYYY-MM-DD)")
    .optional(),
  functionalEffects: z
    .array(z.enum(["phased_return", "altered_hours", "amended_duties", "adapted_workplace"]))
    .default([]),
  notes: z.string().max(2000).optional(),
});

export type CreateFitNoteInput = z.infer<typeof createFitNoteSchema>;
