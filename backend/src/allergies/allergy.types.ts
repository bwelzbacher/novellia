// Plain string column, constrained at the application layer rather than as
// a Postgres enum — see conditions/condition.types.ts for the same pattern.

export const ALLERGY_SEVERITIES = [
  'MILD',
  'MODERATE',
  'SEVERE',
  'LIFE_THREATENING',
] as const;
export type AllergySeverity = (typeof ALLERGY_SEVERITIES)[number];
