// Plain string column (see prisma/schema.prisma), constrained at the
// application layer rather than as a Postgres enum — see pet.types.ts
// for the same pattern applied to species/sex.

export const CONDITION_STATUSES = [
  'ACTIVE',
  'MONITORING',
  'CHRONIC',
  'RESOLVED',
] as const;
export type ConditionStatus = (typeof CONDITION_STATUSES)[number];
