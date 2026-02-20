export type MilestoneActionType = "NOTIFICATION" | "PROMPT" | "TRANSITION" | "ESCALATION" | "REVIEW";

export interface MilestoneActionConfig {
  actionType: MilestoneActionType;
  description: string;
  recipients: ("employee" | "manager" | "hr")[];
  autoComplete?: boolean;
}

/**
 * Maps each milestone key to its action configuration.
 * Defines what type of action is triggered, who receives it, and whether it auto-completes.
 */
export const MILESTONE_ACTION_MAP: Record<string, MilestoneActionConfig> = {
  DAY_1: {
    actionType: "NOTIFICATION",
    description: "Send responsibility notification to employee, manager, and HR",
    recipients: ["employee", "manager", "hr"],
    autoComplete: true,
  },
  DAY_3: {
    actionType: "NOTIFICATION",
    description: "Notify employee about GP visit and fit note requirements",
    recipients: ["employee"],
    autoComplete: true,
  },
  DAY_7: {
    actionType: "TRANSITION",
    description: "Transition case to long-term; prompt fit note upload and expected return date",
    recipients: ["employee", "manager", "hr"],
  },
  WEEK_2: {
    actionType: "PROMPT",
    description: "Initiate check-in and fit note renewal reminder",
    recipients: ["manager", "hr", "employee"],
  },
  WEEK_3: {
    actionType: "PROMPT",
    description: "Fit note renewal reminder",
    recipients: ["employee"],
  },
  WEEK_4: {
    actionType: "PROMPT",
    description: "Request GP or occupational health report",
    recipients: ["manager", "hr"],
  },
  WEEK_6: {
    actionType: "PROMPT",
    description: "Create Plan of Action",
    recipients: ["manager", "hr"],
  },
  WEEK_10: {
    actionType: "ESCALATION",
    description: "First evaluation meeting",
    recipients: ["manager", "hr"],
  },
  WEEK_14: {
    actionType: "ESCALATION",
    description: "Scheduled evaluation meeting",
    recipients: ["manager", "hr"],
  },
  WEEK_18: {
    actionType: "ESCALATION",
    description: "Scheduled evaluation meeting",
    recipients: ["manager", "hr"],
  },
  WEEK_22: {
    actionType: "ESCALATION",
    description: "Scheduled evaluation meeting",
    recipients: ["manager", "hr"],
  },
  WEEK_26: {
    actionType: "ESCALATION",
    description: "Scheduled evaluation meeting",
    recipients: ["manager", "hr"],
  },
  WEEK_30: {
    actionType: "ESCALATION",
    description: "Scheduled evaluation meeting",
    recipients: ["manager", "hr"],
  },
  WEEK_34: {
    actionType: "ESCALATION",
    description: "Scheduled evaluation meeting",
    recipients: ["manager", "hr"],
  },
  WEEK_38: {
    actionType: "ESCALATION",
    description: "Scheduled evaluation meeting",
    recipients: ["manager", "hr"],
  },
  WEEK_42: {
    actionType: "ESCALATION",
    description: "Scheduled evaluation meeting",
    recipients: ["manager", "hr"],
  },
  WEEK_46: {
    actionType: "ESCALATION",
    description: "Scheduled evaluation meeting",
    recipients: ["manager", "hr"],
  },
  WEEK_50: {
    actionType: "ESCALATION",
    description: "Scheduled evaluation meeting",
    recipients: ["manager", "hr"],
  },
  WEEK_52: {
    actionType: "REVIEW",
    description: "Formal capability review",
    recipients: ["manager", "hr"],
  },
};
