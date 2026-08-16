export const ALLERGY_SEVERITIES = [
  'MILD',
  'MODERATE',
  'SEVERE',
  'LIFE_THREATENING',
] as const;
export type AllergySeverity = (typeof ALLERGY_SEVERITIES)[number];
