import { z } from "zod";

export const gpDetailsSchema = z.object({
  gpName: z.string().min(2, "GP name must be at least 2 characters").max(255).optional().nullable(),
  gpAddress: z.string().max(1000).optional().nullable(),
  gpPhone: z.string().max(50).optional().nullable(),
});

export const medicalConsentSchema = z.object({
  consentStatus: z.enum(["GRANTED", "REVOKED"]),
  notes: z.string().max(1000).optional(),
});

export type GpDetailsInput = z.infer<typeof gpDetailsSchema>;
export type MedicalConsentInput = z.infer<typeof medicalConsentSchema>;
