// Plain string columns in the database (see prisma/schema.prisma) are
// constrained to these values at the application layer via class-validator's
// @IsIn(), rather than as a Postgres enum. New values can be added here
// without a database migration.

export const PET_SPECIES = [
  'DOG',
  'CAT',
  'BIRD',
  'REPTILE',
  'RABBIT',
  'OTHER',
] as const;
export type PetSpecies = (typeof PET_SPECIES)[number];

export const PET_SEX = ['MALE', 'FEMALE', 'UNKNOWN'] as const;
export type PetSex = (typeof PET_SEX)[number];

export const PET_INACTIVE_REASON = ['DECEASED', 'REHOMED', 'OTHER'] as const;
export type PetInactiveReason = (typeof PET_INACTIVE_REASON)[number];
