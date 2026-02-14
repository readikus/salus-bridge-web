export enum UserRole {
  PLATFORM_ADMIN = "PLATFORM_ADMIN",
  ORG_ADMIN = "ORG_ADMIN",
  HR = "HR",
  MANAGER = "MANAGER",
  EMPLOYEE = "EMPLOYEE",
}

export enum AuditAction {
  VIEW = "VIEW",
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  EXPORT = "EXPORT",
  LOGIN = "LOGIN",
  INVITE = "INVITE",
}

export enum AuditEntity {
  ORGANISATION = "ORGANISATION",
  USER = "USER",
  EMPLOYEE = "EMPLOYEE",
  ROLE = "ROLE",
  AUDIT_LOG = "AUDIT_LOG",
}

export enum OrganisationStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  DEACTIVATED = "DEACTIVATED",
}

export enum EmployeeStatus {
  ACTIVE = "ACTIVE",
  INVITED = "INVITED",
  DEACTIVATED = "DEACTIVATED",
}

export enum InvitationStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  EXPIRED = "EXPIRED",
}
