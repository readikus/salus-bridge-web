export enum ReferralStatus {
  SUBMITTED = "SUBMITTED",
  IN_PROGRESS = "IN_PROGRESS",
  REPORT_RECEIVED = "REPORT_RECEIVED",
  CLOSED = "CLOSED",
}

export const VALID_REFERRAL_TRANSITIONS: Record<ReferralStatus, ReferralStatus[]> = {
  [ReferralStatus.SUBMITTED]: [ReferralStatus.IN_PROGRESS, ReferralStatus.CLOSED],
  [ReferralStatus.IN_PROGRESS]: [ReferralStatus.REPORT_RECEIVED, ReferralStatus.CLOSED],
  [ReferralStatus.REPORT_RECEIVED]: [ReferralStatus.CLOSED],
  [ReferralStatus.CLOSED]: [],
};

export const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = {
  [ReferralStatus.SUBMITTED]: "Submitted",
  [ReferralStatus.IN_PROGRESS]: "In Progress",
  [ReferralStatus.REPORT_RECEIVED]: "Report Received",
  [ReferralStatus.CLOSED]: "Closed",
};

export enum ReferralUrgency {
  STANDARD = "STANDARD",
  URGENT = "URGENT",
}
