// core/models/feature.model.ts — must mirror backend FeatureKey enum names exactly.

export type FeatureKey =
  | 'STUDENTS'
  | 'TEACHERS'
  | 'SUBJECTS'
  | 'TIMETABLE'
  | 'CLASSES'
  | 'ATTENDANCE'
  | 'EXAMS'
  | 'FEES'
  | 'UDISE'
  | 'REPORTS'
  | 'HOMEWORK'
  | 'NOTICES';

export interface SchoolFeature {
  key: FeatureKey;
  label: string;
  isAddon: boolean;
  enabled: boolean;
}
