// Plain string column (see prisma/schema.prisma), constrained at the
// application layer rather than as a Postgres enum — see condition.types.ts
// for the same pattern applied to Condition.status. Independent of any
// linked condition's status: a medication can be completed or discontinued
// without the condition itself being resolved.

export const MEDICATION_STATUSES = [
  'ACTIVE',
  'COMPLETED',
  'DISCONTINUED',
] as const;
export type MedicationStatus = (typeof MEDICATION_STATUSES)[number];
