import { addDays, differenceInCalendarDays, isAfter, isWithinInterval, setYear } from 'date-fns';
import { MedicalRecord } from '../models/medical-record.model';
import { Pet } from '../models/pet.model';

export interface PetBadge {
  icon: string;
  label: string;
  variant: 'birthday' | 'upcoming' | 'overdue';
}

export function computePetBadges(pet: Pet, records: MedicalRecord[]): PetBadge[] {
  const badges: PetBadge[] = [];

  const birthdayLabel = getBirthdayLabel(pet);
  if (birthdayLabel) {
    badges.push({ icon: 'cake', label: birthdayLabel, variant: 'birthday' });
  }

  if (hasUpcomingAppointmentSoon(records)) {
    badges.push({ icon: 'event', label: 'Vet Visit Reminder', variant: 'upcoming' });
  }

  if (hasMissingAppointmentDetails(records)) {
    badges.push({ icon: 'update', label: 'Missing Visit Details', variant: 'overdue' });
  }

  return badges;
}

export function hasMissingAppointmentDetails(records: MedicalRecord[]): boolean {
  const now = new Date().getTime();

  return records.some(record => {
    const appointmentDate = new Date(record.date).getTime();
    const recordUpdatedDate = new Date(record.updatedAt).getTime();
    if (record.appointment && recordUpdatedDate < appointmentDate && appointmentDate < now) {
      return true;
    }
    return false;
  });
}

function getBirthdayLabel(pet: Pet): string | null {
  if (!pet.dateOfBirth) {
    return null;
  }

  const isBirthday =
    Math.abs(
      differenceInCalendarDays(
        setYear(new Date(pet.dateOfBirth), new Date().getFullYear()),
        new Date()
      )
    ) <= 2;
  if (!isBirthday) {
    return null;
  }

  if (pet.sex === 'MALE') {
    return 'Birthday Boy';
  }
  if (pet.sex === 'FEMALE') {
    return 'Birthday Girl';
  }
  return 'Happy Birthday';
}

function hasUpcomingAppointmentSoon(records: MedicalRecord[]): boolean {
  const now = new Date();
  const cutoff = addDays(now, 14);

  return records.some(record => {
    if (!record.appointment) {
      return false;
    }
    const visitDate = new Date(record.date);
    return isAfter(visitDate, now) && isWithinInterval(visitDate, { start: now, end: cutoff });
  });
}
