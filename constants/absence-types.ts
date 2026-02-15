export enum AbsenceType {
  MUSCULOSKELETAL = "musculoskeletal",
  MENTAL_HEALTH = "mental_health",
  RESPIRATORY = "respiratory",
  SURGICAL = "surgical",
  OTHER = "other",
}

export const ABSENCE_TYPE_LABELS: Record<AbsenceType, string> = {
  [AbsenceType.MUSCULOSKELETAL]: "Musculoskeletal (e.g. back pain, injury)",
  [AbsenceType.MENTAL_HEALTH]: "Mental health (e.g. stress, anxiety)",
  [AbsenceType.RESPIRATORY]: "Respiratory (e.g. cold, flu, COVID)",
  [AbsenceType.SURGICAL]: "Surgical / planned procedure",
  [AbsenceType.OTHER]: "Other",
};
