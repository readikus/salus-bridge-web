export interface MilestoneDefault {
  key: string;
  label: string;
  dayOffset: number;
  description: string;
}

export const DEFAULT_MILESTONES: MilestoneDefault[] = [
  { key: "DAY_1", label: "Day 1 - Absence Reported", dayOffset: 1, description: "Initial absence notification to employee, manager, and HR" },
  { key: "DAY_3", label: "Day 3 - GP Visit Reminder", dayOffset: 3, description: "Remind employee about GP visit and fit note requirements" },
  { key: "DAY_7", label: "Day 7 - Long-Term Transition", dayOffset: 7, description: "Case transitions to long-term; prompt for fit note upload and expected return date" },
  { key: "WEEK_2", label: "Week 2 - Check-in", dayOffset: 14, description: "Check-in prompt and fit note renewal reminder" },
  { key: "WEEK_3", label: "Week 3 - Fit Note Renewal", dayOffset: 21, description: "Fit note renewal reminder" },
  { key: "WEEK_4", label: "Week 4 - GP/OH Report Request", dayOffset: 28, description: "Prompt HR/manager to request GP or occupational health report" },
  { key: "WEEK_6", label: "Week 6 - Plan of Action", dayOffset: 42, description: "Prompt creation of a Plan of Action" },
  { key: "WEEK_10", label: "Week 10 - First Evaluation", dayOffset: 70, description: "First evaluation meeting" },
  { key: "WEEK_14", label: "Week 14 - Evaluation", dayOffset: 98, description: "Scheduled evaluation meeting" },
  { key: "WEEK_18", label: "Week 18 - Evaluation", dayOffset: 126, description: "Scheduled evaluation meeting" },
  { key: "WEEK_22", label: "Week 22 - Evaluation", dayOffset: 154, description: "Scheduled evaluation meeting" },
  { key: "WEEK_26", label: "Week 26 - Evaluation", dayOffset: 182, description: "Scheduled evaluation meeting" },
  { key: "WEEK_30", label: "Week 30 - Evaluation", dayOffset: 210, description: "Scheduled evaluation meeting" },
  { key: "WEEK_34", label: "Week 34 - Evaluation", dayOffset: 238, description: "Scheduled evaluation meeting" },
  { key: "WEEK_38", label: "Week 38 - Evaluation", dayOffset: 266, description: "Scheduled evaluation meeting" },
  { key: "WEEK_42", label: "Week 42 - Evaluation", dayOffset: 294, description: "Scheduled evaluation meeting" },
  { key: "WEEK_46", label: "Week 46 - Evaluation", dayOffset: 322, description: "Scheduled evaluation meeting" },
  { key: "WEEK_50", label: "Week 50 - Evaluation", dayOffset: 350, description: "Scheduled evaluation meeting" },
  { key: "WEEK_52", label: "Week 52 - Capability Review", dayOffset: 364, description: "Formal capability review trigger" },
];
