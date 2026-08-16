import { Condition } from './condition.model';
import { VetRecord } from './vet-record.model';

export const RECORD_KINDS = ['APPOINTMENT', 'VACCINE', 'CONDITION', 'MEDICATION', 'NOTE'] as const;
export type RecordKind = (typeof RECORD_KINDS)[number];

export const APPOINTMENT_NOTE_TYPES = ['STAFF', 'DISCHARGE', 'PERSONAL', 'CARE_PLAN', 'OTHER'] as const;
export type AppointmentNoteType = (typeof APPOINTMENT_NOTE_TYPES)[number];

export const MEDICATION_STATUSES = ['ACTIVE', 'COMPLETED', 'DISCONTINUED'] as const;
export type MedicationStatus = (typeof MEDICATION_STATUSES)[number];

export interface AppointmentNote {
  id: string;
  appointmentRecordId: string;
  type: AppointmentNoteType;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentRecord {
  id: string;
  medicalRecordId: string;
  conditionId: string | null;
  condition: Condition | null;
  time: string;
  vet: string | null;
  reason: string;
  weightLbs: number | null;
  temperatureF: number | null;
  notes: AppointmentNote[];
  createdAt: string;
  updatedAt: string;
}

export interface VaccineRecord {
  id: string;
  medicalRecordId: string;
  name: string;
  administeredDate: string;
  nextDueDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationRecord {
  id: string;
  medicalRecordId: string;
  conditionId: string | null;
  condition: Condition | null;
  name: string;
  dosage: string | null;
  duration: string | null;
  prescriber: string | null;
  notes: string | null;
  status: MedicationStatus;
  createdAt: string;
  updatedAt: string;
}

// A "visit": optionally attaches one appointment plus any number of
// vaccine/medication records, and optionally a vet record (a medication-only
// visit, e.g. an OTC medication, doesn't require one). Conditions are their
// own top-level entity (see condition.model.ts) referenced by appointments
// and medications, not owned by a single visit.
export interface MedicalRecord {
  id: string;
  petId: string;
  vetRecordId: string | null;
  vetRecord: VetRecord | null;
  date: string;
  sourceSystem: string | null;
  appointment: AppointmentRecord | null;
  vaccineRecords: VaccineRecord[];
  medicationRecords: MedicationRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentNotePayload {
  type: AppointmentNoteType;
  text: string;
}

export interface CreateAppointmentPayload {
  time: string;
  vet?: string;
  reason: string;
  weightLbs?: number;
  temperatureF?: number;
  notes?: CreateAppointmentNotePayload[];
  conditionId?: string;
}

export interface CreateVaccinePayload {
  name: string;
  administeredDate: string;
  nextDueDate?: string;
  notes?: string;
}

export interface CreateMedicationPayload {
  conditionId?: string;
  name: string;
  dosage?: string;
  duration?: string;
  prescriber?: string;
  notes?: string;
  status?: MedicationStatus;
}

export interface CreateMedicalRecordPayload {
  petId: string;
  vetRecordId?: string;
  date: string;
  sourceSystem?: string;
  appointment?: CreateAppointmentPayload;
  vaccineRecords?: CreateVaccinePayload[];
  medicationRecords?: CreateMedicationPayload[];
}

// vaccineRecords/medicationRecords, when provided, replace the full
// existing set for that relation rather than merging into it — matches the
// backend's PATCH /medical-records/:id semantics.
export interface UpdateMedicalRecordPayload {
  vetRecordId?: string;
  date?: string;
  sourceSystem?: string;
  appointment?: CreateAppointmentPayload;
  vaccineRecords?: CreateVaccinePayload[];
  medicationRecords?: CreateMedicationPayload[];
}
