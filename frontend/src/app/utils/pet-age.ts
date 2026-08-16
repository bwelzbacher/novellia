import { differenceInMonths, differenceInYears } from 'date-fns';

export function computePetAge(dateOfBirth: string | null): string | null {
  if (!dateOfBirth) {
    return null;
  }

  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const years = differenceInYears(today, birthDate);
  const months = differenceInMonths(today, birthDate) % 12;

  if (years <= 0) {
    return `${Math.max(months, 0)} mo`;
  }
  return `${years} yr${years === 1 ? '' : 's'}`;
}
