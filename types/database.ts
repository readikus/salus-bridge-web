import { UserRole as UserRoleEnum, AuditAction, AuditEntity, OrganisationStatus, EmployeeStatus } from "./enums";

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  status: OrganisationStatus;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  auth0Id: string | null;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRoleRecord {
  id: string;
  userId: string;
  organisationId: string;
  role: UserRoleEnum;
  createdAt: Date;
}

export interface Department {
  id: string;
  organisationId: string;
  name: string;
  createdAt: Date;
}

export interface Employee {
  id: string;
  userId: string | null;
  organisationId: string;
  departmentId: string | null;
  managerId: string | null;
  jobTitle: string | null;
  status: EmployeeStatus;
  invitationToken: string | null;
  invitationExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  organisationId: string | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: Date;
}

export interface CreateAuditLogParams {
  userId?: string;
  organisationId?: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface AuditFilters extends PaginationOptions {
  entity?: string;
  action?: string;
}
