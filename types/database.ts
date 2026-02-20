import { UserRole as UserRoleEnum, AuditAction, AuditEntity, OrganisationStatus, EmployeeStatus } from "./enums";
import { SicknessState } from "@/constants/sickness-states";
import { AbsenceType } from "@/constants/absence-types";

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
  supabaseAuthId: string | null;
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
  gpName: string | null;
  gpAddress: string | null;
  gpPhone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Extended employee with joined user and department data.
 * Used for list/detail views.
 */
export interface EmployeeWithDetails extends Employee {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  departmentName: string | null;
  managerFirstName: string | null;
  managerLastName: string | null;
  managerEmail: string | null;
}

export interface CreateEmployeeParams {
  organisationId: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
  departmentId?: string;
  managerId?: string;
}

export interface UpdateEmployeeParams {
  firstName?: string;
  lastName?: string;
  email?: string;
  jobTitle?: string;
  departmentId?: string | null;
  managerId?: string | null;
  status?: EmployeeStatus;
}

export interface EmployeeFilters {
  status?: string;
  departmentId?: string;
  managerId?: string;
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

export interface SicknessCase {
  id: string;
  organisationId: string;
  employeeId: string;
  reportedBy: string;
  status: SicknessState;
  absenceType: AbsenceType;
  absenceStartDate: string;
  absenceEndDate: string | null;
  workingDaysLost: number | null;
  notesEncrypted: string | null;
  isLongTerm: boolean;
  createdAt: Date;
  updatedAt: Date;
  employeeFirstName?: string;
  employeeLastName?: string;
}

export interface CaseTransition {
  id: string;
  sicknessCaseId: string;
  fromStatus: string | null;
  toStatus: string;
  action: string;
  performedBy: string;
  notes: string | null;
  createdAt: Date;
}

export interface FitNote {
  id: string;
  organisationId: string;
  sicknessCaseId: string;
  employeeId: string;
  uploadedBy: string;
  storagePath: string;
  fileName: string;
  fileSizeBytes: number | null;
  contentType: string | null;
  fitNoteStatus: string;
  startDate: string;
  endDate: string | null;
  functionalEffects: string[];
  notesEncrypted: string | null;
  createdAt: Date;
}

export interface RtwMeeting {
  id: string;
  organisationId: string;
  sicknessCaseId: string;
  employeeId: string;
  scheduledBy: string;
  scheduledDate: Date;
  completedDate: Date | null;
  status: string;
  questionnaireResponses: Record<string, unknown> | null;
  outcomesEncrypted: string | null;
  adjustments: Array<{ type: string; description: string; reviewDate?: string }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface GuidanceEngagement {
  id: string;
  organisationId: string;
  sicknessCaseId: string;
  userId: string;
  guidanceType: string;
  guidanceStep: string;
  engagedAt: Date;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface TriggerConfig {
  id: string;
  organisationId: string;
  name: string;
  triggerType: string;
  thresholdValue: number;
  periodDays: number | null;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TriggerAlert {
  id: string;
  organisationId: string;
  triggerConfigId: string;
  employeeId: string;
  sicknessCaseId: string | null;
  triggeredValue: number;
  acknowledgedBy: string | null;
  acknowledgedAt: Date | null;
  createdAt: Date;
}

export interface TriggerAlertWithDetails extends TriggerAlert {
  triggerName: string;
  triggerType: string;
  thresholdValue: number;
  employeeFirstName: string | null;
  employeeLastName: string | null;
}

export interface OhProvider {
  id: string;
  organisationId: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OhReferral {
  id: string;
  organisationId: string;
  sicknessCaseId: string;
  employeeId: string;
  providerId: string;
  referredBy: string;
  status: string;
  reason: string;
  urgency: string;
  reportReceivedAt: Date | null;
  reportNotesEncrypted: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OhReferralWithDetails extends OhReferral {
  employeeFirstName: string | null;
  employeeLastName: string | null;
  providerName: string;
  absenceType: string | null;
  absenceStartDate: string | null;
}

export interface OhReferralCommunication {
  id: string;
  referralId: string;
  authorId: string;
  direction: string;
  message: string;
  createdAt: Date;
}

export interface OhReferralCommunicationWithAuthor extends OhReferralCommunication {
  authorFirstName: string | null;
  authorLastName: string | null;
  authorEmail: string;
}

export interface MilestoneConfig {
  id: string;
  organisationId: string | null;
  milestoneKey: string;
  label: string;
  dayOffset: number;
  description: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MilestoneConfigWithGuidance extends MilestoneConfig {
  guidance: MilestoneGuidanceContent | null;
  guidanceIsDefault: boolean;
}

export interface MedicalRecordsConsent {
  id: string;
  organisationId: string;
  employeeId: string;
  consentedBy: string;
  consentStatus: string;
  consentDate: Date | null;
  revokedDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalRecordsConsentWithEmployee extends MedicalRecordsConsent {
  employeeFirstName: string | null;
  employeeLastName: string | null;
  employeeEmail: string | null;
}

export interface MilestoneAction {
  id: string;
  organisationId: string;
  sicknessCaseId: string;
  milestoneKey: string;
  actionType: string;
  status: string;
  dueDate: string;
  completedBy: string | null;
  completedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MilestoneActionWithDetails extends MilestoneAction {
  milestoneLabel: string;
  employeeFirstName: string | null;
  employeeLastName: string | null;
}

export interface CommunicationLogEntry {
  id: string;
  organisationId: string;
  sicknessCaseId: string;
  authorId: string;
  contactDate: string;
  contactType: string;
  notes: string;
  createdAt: Date;
}

export interface CommunicationLogEntryWithAuthor extends CommunicationLogEntry {
  authorFirstName: string | null;
  authorLastName: string | null;
  authorEmail: string;
}

export interface MilestoneGuidanceRecord {
  id: string;
  organisationId: string | null;
  milestoneKey: string;
  actionTitle: string;
  managerGuidance: string;
  suggestedText: string;
  instructions: string[];
  employeeView: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Content-only fields from milestone guidance, used by UI components.
 */
export interface MilestoneGuidanceContent {
  actionTitle: string;
  managerGuidance: string;
  suggestedText: string;
  instructions: string[];
  employeeView: string;
}

export interface AuditFilters extends PaginationOptions {
  entity?: string;
  action?: string;
}

/**
 * Data subject record for SAR readiness (COMP-05).
 * Contains all data held about an employee.
 */
export interface DataSubjectRecord {
  personalInfo: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    jobTitle: string | null;
    departmentName: string | null;
    managerName: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
  roles: {
    role: string;
    organisationName: string;
    createdAt: Date;
  }[];
  activityLog: AuditLog[];
}
