import { z } from "zod";

/**
 * Schema for password setup during invitation acceptance.
 * Requires minimum 8 characters with at least one letter and one number.
 */
export const SetPasswordSchema = z
  .object({
    token: z.string().uuid("Invalid invitation token"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-zA-Z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SetPasswordInput = z.infer<typeof SetPasswordSchema>;

/**
 * Schema for bulk invitation request.
 * Accepts an array of employee UUIDs.
 */
export const InviteSchema = z.object({
  employeeIds: z.array(z.string().uuid("Invalid employee ID")).min(1, "At least one employee ID is required"),
});

export type InviteInput = z.infer<typeof InviteSchema>;
