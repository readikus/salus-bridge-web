import { z } from "zod";

export const ohProviderSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(200, "Name must be at most 200 characters"),
  contactEmail: z.string().email("Must be a valid email").optional().or(z.literal("")),
  contactPhone: z.string().max(50).optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type OhProviderInput = z.infer<typeof ohProviderSchema>;
