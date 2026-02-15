export enum SicknessState {
  REPORTED = "REPORTED",
  TRACKING = "TRACKING",
  FIT_NOTE_RECEIVED = "FIT_NOTE_RECEIVED",
  RTW_SCHEDULED = "RTW_SCHEDULED",
  RTW_COMPLETED = "RTW_COMPLETED",
  CLOSED = "CLOSED",
}

export enum SicknessAction {
  ACKNOWLEDGE = "acknowledge",
  RECEIVE_FIT_NOTE = "receive_fit_note",
  SCHEDULE_RTW = "schedule_rtw",
  COMPLETE_RTW = "complete_rtw",
  CLOSE_CASE = "close_case",
  REOPEN = "reopen",
}

export const VALID_TRANSITIONS: Record<SicknessState, Partial<Record<SicknessAction, SicknessState>>> = {
  [SicknessState.REPORTED]: {
    [SicknessAction.ACKNOWLEDGE]: SicknessState.TRACKING,
  },
  [SicknessState.TRACKING]: {
    [SicknessAction.RECEIVE_FIT_NOTE]: SicknessState.FIT_NOTE_RECEIVED,
    [SicknessAction.SCHEDULE_RTW]: SicknessState.RTW_SCHEDULED,
  },
  [SicknessState.FIT_NOTE_RECEIVED]: {
    [SicknessAction.SCHEDULE_RTW]: SicknessState.RTW_SCHEDULED,
    [SicknessAction.RECEIVE_FIT_NOTE]: SicknessState.FIT_NOTE_RECEIVED,
  },
  [SicknessState.RTW_SCHEDULED]: {
    [SicknessAction.COMPLETE_RTW]: SicknessState.RTW_COMPLETED,
  },
  [SicknessState.RTW_COMPLETED]: {
    [SicknessAction.CLOSE_CASE]: SicknessState.CLOSED,
  },
  [SicknessState.CLOSED]: {
    [SicknessAction.REOPEN]: SicknessState.TRACKING,
  },
};

export enum FitNoteStatus {
  NOT_FIT = "NOT_FIT",
  MAY_BE_FIT = "MAY_BE_FIT",
}

export enum FunctionalEffect {
  PHASED_RETURN = "phased_return",
  ALTERED_HOURS = "altered_hours",
  AMENDED_DUTIES = "amended_duties",
  ADAPTED_WORKPLACE = "adapted_workplace",
}

export enum RtwMeetingStatus {
  SCHEDULED = "SCHEDULED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}
