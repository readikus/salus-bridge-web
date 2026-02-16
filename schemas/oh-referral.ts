import { z } from "zod";
import { ReferralStatus, ReferralUrgency } from "@/constants/referral-statuses";

export const createOhReferralSchema = z.object({
  sicknessCaseId: z.string().uuid("Must be a valid sickness case ID"),
  providerId: z.string().uuid("Must be a valid provider ID"),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  urgency: z.nativeEnum(ReferralUrgency).default(ReferralUrgency.STANDARD),
});

export type CreateOhReferralInput = z.infer<typeof createOhReferralSchema>;

export const updateReferralStatusSchema = z.object({
  status: z.nativeEnum(ReferralStatus),
  reportNotesEncrypted: z.string().optional(),
});

export type UpdateReferralStatusInput = z.infer<typeof updateReferralStatusSchema>;

export const addCommunicationSchema = z.object({
  direction: z.enum(["INBOUND", "OUTBOUND"]),
  message: z.string().min(1, "Message is required"),
});

export type AddCommunicationInput = z.infer<typeof addCommunicationSchema>;
