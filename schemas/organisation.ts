import { z } from "zod";

/**
 * Schema for creating a new organisation.
 */
export const CreateOrganisationSchema = z.object({
  name: z
    .string()
    .min(3, "Organisation name must be at least 3 characters")
    .max(100, "Organisation name must be at most 100 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug must be at most 50 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens only"),
});

export type CreateOrganisationInput = z.infer<typeof CreateOrganisationSchema>;

/**
 * Schema for updating an existing organisation.
 */
export const UpdateOrganisationSchema = z.object({
  name: z
    .string()
    .min(3, "Organisation name must be at least 3 characters")
    .max(100, "Organisation name must be at most 100 characters")
    .optional(),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug must be at most 50 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens only")
    .optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "DEACTIVATED"]).optional(),
});

export type UpdateOrganisationInput = z.infer<typeof UpdateOrganisationSchema>;

/**
 * Schema for organisation settings (stored as JSONB).
 * Configurable by org admins (ORG-05).
 */
export const OrgSettingsSchema = z.object({
  absenceTriggerThresholds: z
    .object({
      shortTermDays: z.number().int().min(1).max(365).default(3),
      longTermDays: z.number().int().min(1).max(365).default(28),
      frequencyCount: z.number().int().min(1).max(50).default(3),
      frequencyPeriodDays: z.number().int().min(1).max(365).default(90),
    })
    .default({}),
  notificationPreferences: z
    .object({
      emailOnAbsenceReport: z.boolean().default(true),
      emailOnReturnToWork: z.boolean().default(true),
      emailOnThresholdBreach: z.boolean().default(true),
      dailyDigest: z.boolean().default(false),
    })
    .default({}),
});

export type OrgSettings = z.infer<typeof OrgSettingsSchema>;

/**
 * Schema for assigning an admin to an organisation.
 */
export const AssignAdminSchema = z.object({
  email: z.string().email("Must be a valid email address"),
});

export type AssignAdminInput = z.infer<typeof AssignAdminSchema>;
