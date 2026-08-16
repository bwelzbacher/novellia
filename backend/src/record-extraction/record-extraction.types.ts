import { CONDITION_STATUSES } from '../conditions/condition.types';
import type { ConditionStatus } from '../conditions/condition.types';

// Shape Claude returns via output_config.format (structured outputs).
// "Not found in the document" is represented as an empty string, not null —
// Claude's structured-outputs schemas cap out at 16 nullable/union-typed
// parameters, and this shape needed more than that. Every place downstream
// that checks these fields treats '' and null identically (plain
// truthiness), so dropping the nullable union costs nothing.

export interface ExtractedVetOffice {
  name: string;
  address: string;
  phone: string;
}

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
  // The condition/diagnosis this medication treats, by name — Claude has no
  // access to conditionId, so resolution against existing Condition rows
  // happens afterward in the service, not the model call.
  conditionName: string;
}

export interface ExtractedCondition {
  name: string;
  status: ConditionStatus;
  diagnosingPhysician: string;
  notes: string;
}

export interface ExtractionResult {
  vetOffice: ExtractedVetOffice;
  date: string;
  appointment: ExtractedAppointment;
  vaccineRecords: ExtractedVaccineRecord[];
  medicationRecords: ExtractedMedicationRecord[];
  conditionsReferenced: ExtractedCondition[];
}

// A name extracted from the document, resolved against what's already in
// the database. isNew tells the review UI whether confirming this draft
// will create a new VetRecord/Condition or reuse an existing one.
export interface ResolvedReference {
  id: string | null;
  name: string;
  isNew: boolean;
}

// Carries address/phone alongside the resolution so the review UI can
// pre-fill a new-vet-record form without a second round trip — lost if we
// only kept the resolved id/name/isNew.
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

// What the controller returns: the extraction result, with names resolved
// to existing rows where possible, plus warnings for anything a human needs
// to fill in before this can be submitted to POST /medical-records or
// POST /conditions. Nothing here is persisted — it's a pre-filled draft for
// the review step.
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

const STRING = { type: 'string' } as const;

export const RECORD_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    vetOffice: {
      type: 'object',
      properties: {
        name: STRING,
        address: STRING,
        phone: STRING,
      },
      required: ['name', 'address', 'phone'],
      additionalProperties: false,
    },
    date: {
      ...STRING,
      description:
        'The visit/document date in YYYY-MM-DD format, if stated — otherwise "".',
    },
    appointment: {
      type: 'object',
      properties: {
        time: STRING,
        vet: STRING,
        reason: STRING,
        summaryNotes: STRING,
        weight: {
          ...STRING,
          description:
            'Weight in pounds, as a plain number (e.g. "42.5"), if stated.',
        },
        temperature: {
          ...STRING,
          description:
            'Temperature in Fahrenheit, as a plain number (e.g. "101.5"), if stated.',
        },
      },
      required: [
        'time',
        'vet',
        'reason',
        'summaryNotes',
        'weight',
        'temperature',
      ],
      additionalProperties: false,
    },
    vaccineRecords: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: STRING,
          nextDueDate: {
            ...STRING,
            description:
              'The next-due date in YYYY-MM-DD format, if stated — otherwise "".',
          },
          notes: STRING,
        },
        required: ['name', 'nextDueDate', 'notes'],
        additionalProperties: false,
      },
    },
    medicationRecords: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: STRING,
          dosage: STRING,
          duration: STRING,
          prescriber: STRING,
          notes: STRING,
          conditionName: STRING,
        },
        required: [
          'name',
          'dosage',
          'duration',
          'prescriber',
          'notes',
          'conditionName',
        ],
        additionalProperties: false,
      },
    },
    conditionsReferenced: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: STRING,
          status: { type: 'string', enum: CONDITION_STATUSES },
          diagnosingPhysician: STRING,
          notes: STRING,
        },
        required: ['name', 'status', 'diagnosingPhysician', 'notes'],
        additionalProperties: false,
      },
    },
  },
  required: [
    'vetOffice',
    'date',
    'appointment',
    'vaccineRecords',
    'medicationRecords',
    'conditionsReferenced',
  ],
  additionalProperties: false,
} as const;

export const RECORD_EXTRACTION_PROMPT = `You are extracting structured veterinary record data from a document a pet owner uploaded — a visit summary, discharge paperwork, vaccine certificate, or prescription label.

Extract only information explicitly present in the document. Do not infer, guess, or fill in a typical/default value for anything not stated — use an empty string "" instead. Dates must be YYYY-MM-DD. If the document references a diagnosis or condition (e.g. a medication's indication, or a stated diagnosis), include it in conditionsReferenced or as a medication's conditionName using the name as written in the document. If the document describes no scheduled appointment/visit at all (e.g. it's just a vaccine certificate or prescription label), leave every appointment field as "". If vitals (weight, temperature) are recorded, extract the plain numeric value without units.`;
