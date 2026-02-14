import { z } from "zod";
import { EmployeeStatus } from "@/types/enums";

export const CreateEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address").max(255),
  jobTitle: z.string().max(200).optional().or(z.literal("")),
  departmentName: z.string().max(200).optional().or(z.literal("")),
  managerId: z.string().uuid().optional().or(z.literal("")),
});

export const UpdateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().max(255).optional(),
  jobTitle: z.string().max(200).optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  managerId: z.string().uuid().optional().nullable(),
  status: z.nativeEnum(EmployeeStatus).optional(),
});

export const AssignRoleSchema = z.object({
  role: z.enum(["MANAGER", "HR", "EMPLOYEE"]),
});

export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;
export type AssignRoleInput = z.infer<typeof AssignRoleSchema>;
