// Plain string column, constrained at the application layer rather than as
// a Postgres enum — see conditions/condition.types.ts for the same pattern.

export const APPOINTMENT_NOTE_TYPES = [
  'STAFF',
  'DISCHARGE',
  'PERSONAL',
  'CARE_PLAN',
  'OTHER',
] as const;
export type AppointmentNoteType = (typeof APPOINTMENT_NOTE_TYPES)[number];
