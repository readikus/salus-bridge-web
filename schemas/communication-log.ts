import { z } from "zod";

/**
 * Schema for creating a communication log entry.
 */
export const createCommunicationLogSchema = z.object({
  contactDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  contactType: z.enum(["PHONE_CALL", "EMAIL", "IN_PERSON", "VIDEO_CALL", "LETTER", "OTHER"]),
  notes: z.string().min(1, "Notes are required").max(5000, "Notes must be 5000 characters or fewer"),
});

export type CreateCommunicationLogInput = z.infer<typeof createCommunicationLogSchema>;
