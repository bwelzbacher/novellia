import { AppointmentNote } from './medical-record.model';
import { VetRecord } from './vet-record.model';

export const CONDITION_STATUSES = ['ACTIVE', 'MONITORING', 'CHRONIC', 'RESOLVED'] as const;
export type ConditionStatus = (typeof CONDITION_STATUSES)[number];

export interface Condition {
  id: string;
  petId: string;
  name: string;
  diagnosingPhysician: string | null;
  status: ConditionStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConditionPayload {
  petId: string;
  name: string;
  diagnosingPhysician?: string;
  status: ConditionStatus;
  notes?: string;
}

export interface UpdateConditionPayload {
  name?: string;
  diagnosingPhysician?: string;
  status?: ConditionStatus;
  notes?: string;
}

export interface ConditionRelatedVisit {
  id: string;
  date: string;
  vetRecord: VetRecord | null;
}

export interface ConditionAppointment {
  id: string;
  time: string;
  vet: string | null;
  reason: string;
  notes: AppointmentNote[];
  medicalRecord: ConditionRelatedVisit;
}

export interface ConditionMedication {
  id: string;
  name: string;
  dosage: string | null;
  duration: string | null;
  prescriber: string | null;
  notes: string | null;
  medicalRecord: ConditionRelatedVisit;
}

export interface ConditionDetail extends Condition {
  appointments: ConditionAppointment[];
  medications: ConditionMedication[];
}
