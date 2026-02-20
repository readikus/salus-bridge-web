import { z } from "zod";
import { AbsenceType } from "@/constants/absence-types";

export const createSicknessCaseSchema = z.object({
  absenceType: z.nativeEnum(AbsenceType),
  absenceStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a valid date (YYYY-MM-DD)"),
  absenceEndDate: z
    .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a valid date (YYYY-MM-DD)"), z.literal("")])
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  notes: z.string().max(2000).optional(),
  employeeId: z.string().uuid("Must be a valid employee ID"),
});

export type CreateSicknessCaseInput = z.infer<typeof createSicknessCaseSchema>;
