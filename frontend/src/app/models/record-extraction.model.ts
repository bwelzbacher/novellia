import { ConditionStatus } from './condition.model';

export interface ExtractedAppointment {
  time: string;
  vet: string;
  reason: string;
  summaryNotes: string;
  weight: string;
  temperature: string;
}

export interface ExtractedVaccineRecord {
  name: string;
  nextDueDate: string;
  notes: string;
}

export interface ExtractedMedicationRecord {
  name: string;
  dosage: string;
  duration: string;
  prescriber: string;
  notes: string;
  conditionName: string;
}

export interface ExtractedCondition {
  name: string;
  status: ConditionStatus;
  diagnosingPhysician: string;
  notes: string;
}

export interface ResolvedReference {
  id: string | null;
  name: string;
  isNew: boolean;
}

export interface DraftVetRecord extends ResolvedReference {
  address: string;
  phone: string;
}

export interface DraftMedicationRecord extends ExtractedMedicationRecord {
  condition: ResolvedReference | null;
}

export interface DraftCondition extends ExtractedCondition {
  resolved: ResolvedReference;
}

export interface RecordExtractionDraft {
  petId: string;
  vetRecord: DraftVetRecord;
  date: string;
  appointment: ExtractedAppointment;
  vaccineRecords: ExtractedVaccineRecord[];
  medicationRecords: DraftMedicationRecord[];
  conditionsReferenced: DraftCondition[];
  warnings: string[];
}
