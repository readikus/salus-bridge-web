import { SicknessAction } from "@/constants/sickness-states";

/**
 * Maps milestone keys to their corresponding workflow state transition.
 * When a milestone card has a mapped transition, completing the action
 * also offers to trigger the state transition.
 */
export const MILESTONE_TRANSITIONS: Partial<Record<string, SicknessAction>> = {
  DAY_1: SicknessAction.ACKNOWLEDGE,
  DAY_7: SicknessAction.RECEIVE_FIT_NOTE,
};
