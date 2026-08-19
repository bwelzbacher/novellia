import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButton } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from "@angular/material/icon";
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { finalize, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { CONDITION_STATUSES, Condition, ConditionStatus } from '../../../models/condition.model';
import {
  APPOINTMENT_NOTE_TYPES,
  AppointmentNoteType,
  CreateMedicalRecordPayload,
  CreateMedicationPayload,
  MEDICATION_STATUSES,
  MedicalRecord,
  MedicationRecord,
  MedicationStatus,
  RecordKind,
  UpdateMedicalRecordPayload,
} from '../../../models/medical-record.model';
import { VetRecord } from '../../../models/vet-record.model';
import { FormatConstPipe } from '../../../pipes/format-const.pipe';
import { ConditionsService } from '../../../services/conditions.service';
import { MedicalRecordsService } from '../../../services/medical-records.service';
import { VetRecordsService } from '../../../services/vet-records.service';
import { dateNotInPast } from '../../../utils/date-validators';

export interface MedicalRecordFormSheetData {
  petId: string;
  kind: RecordKind;
  date?: string;
  existingRecord?: MedicalRecord;
  existingMedicationId?: string;
}

type AppointmentNoteGroup = FormGroup<{
  type: FormControl<AppointmentNoteType>;
  text: FormControl<string>;
}>;

@Component({
  selector: 'app-medical-record-form-sheet',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatError,
    MatInput,
    MatSelect,
    MatOption,
    MatButton,
    MatIcon,
    FormatConstPipe
  ],
  templateUrl: './medical-record-form-sheet.html',
  styleUrl: './medical-record-form-sheet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicalRecordFormSheet {
  readonly data = inject<MedicalRecordFormSheetData>(MAT_BOTTOM_SHEET_DATA);
  private readonly sheetRef = inject(MatBottomSheetRef<MedicalRecordFormSheet, boolean>);
  private readonly medicalRecordsService = inject(MedicalRecordsService);
  private readonly vetRecordsService = inject(VetRecordsService);
  private readonly conditionsService = inject(ConditionsService);
  private readonly fb = inject(FormBuilder);

  protected readonly saving = signal(false);
  protected readonly addingNewVet = signal(false);
  protected readonly vetRecords = signal<VetRecord[]>([]);
  protected readonly addingNewCondition = signal(false);
  protected readonly conditions = signal<Condition[]>([]);
  protected readonly conditionStatuses = CONDITION_STATUSES;
  protected readonly medicationStatuses = MEDICATION_STATUSES;
  protected readonly appointmentNoteTypes = APPOINTMENT_NOTE_TYPES;
  protected readonly kind = this.data.kind;


  protected readonly needsVetAndDate = this.kind !== 'CONDITION' && !this.data.existingRecord;
  protected readonly requiresVetRecord = this.kind !== 'CONDITION' && this.kind !== 'MEDICATION';
  protected readonly showsConditionPicker = this.kind === 'APPOINTMENT' || this.kind === 'MEDICATION';
  protected readonly isEditingAppointment =
    (this.kind === 'APPOINTMENT' || this.kind === 'NOTE') && !!this.data.existingRecord?.appointment;
  protected readonly isEditingMedication = this.kind === 'MEDICATION' && !!this.data.existingMedicationId;
  protected readonly isEditing = this.isEditingAppointment || this.isEditingMedication;
  protected readonly showsAppointmentNotesArray = this.kind === 'APPOINTMENT' && !this.data.existingRecord;

  protected readonly form = this.fb.nonNullable.group({
    vetRecordId: [''],
    date: [
      this.data.date ?? new Date().toISOString().substring(0, 10),
      Validators.required,
    ],
    newVetOfficeName: [''],
    newVetAddress: [''],
    newVetPhoneNumber: [''],
    newVetHours: [''],
    appointmentTime: [''],
    appointmentVet: [''],
    appointmentReason: [''],
    appointmentWeightLbs: this.fb.control<number | null>(null),
    appointmentTemperatureF: this.fb.control<number | null>(null),
    vaccineName: [''],
    vaccineNextDueDate: ['', dateNotInPast],
    vaccineNotes: [''],
    conditionId: [''],
    conditionName: [''],
    conditionDiagnosingPhysician: [''],
    conditionStatus: ['ACTIVE' as ConditionStatus],
    conditionNotes: [''],
    medicationName: [''],
    medicationDosage: [''],
    medicationDuration: [''],
    medicationPrescriber: [''],
    medicationNotes: [''],
    medicationStatus: ['ACTIVE' as MedicationStatus],
    noteType: ['STAFF' as AppointmentNoteType],
    noteText: [''],
  });

  protected readonly appointmentNotes = this.fb.array<AppointmentNoteGroup>([]);

  constructor() {
    if (this.kind === 'APPOINTMENT') {
      this.form.controls.appointmentReason.addValidators(Validators.required);
    } else if (this.kind === 'VACCINE') {
      this.form.controls.vaccineName.addValidators(Validators.required);
    } else if (this.kind === 'CONDITION') {
      this.form.controls.conditionName.addValidators(Validators.required);
    } else if (this.kind === 'MEDICATION') {
      this.form.controls.medicationName.addValidators(Validators.required);
    } else if (this.kind === 'NOTE') {
      this.form.controls.noteText.addValidators(Validators.required)
    }
    this.form.updateValueAndValidity();

    const existingAppointment = this.data.existingRecord?.appointment;
    if (this.isEditingAppointment && existingAppointment) {
      this.form.patchValue({
        appointmentTime: existingAppointment.time,
        appointmentVet: existingAppointment.vet ?? '',
        appointmentReason: existingAppointment.reason,
        appointmentWeightLbs: existingAppointment.weightLbs,
        appointmentTemperatureF: existingAppointment.temperatureF,
        conditionId: existingAppointment.conditionId ?? '',
      });
    }

    const existingMedication = this.data.existingRecord?.medicationRecords.find(
      medication => medication.id === this.data.existingMedicationId,
    );
    if (this.isEditingMedication && existingMedication) {
      this.form.patchValue({
        medicationName: existingMedication.name,
        medicationDosage: existingMedication.dosage ?? '',
        medicationDuration: existingMedication.duration ?? '',
        medicationPrescriber: existingMedication.prescriber ?? '',
        medicationNotes: existingMedication.notes ?? '',
        medicationStatus: existingMedication.status,
        conditionId: existingMedication.conditionId ?? '',
      });
    }

    if (this.needsVetAndDate) {
      this.vetRecordsService.getVetRecords().subscribe(vetRecords => {
        this.vetRecords.set(vetRecords);
        if (this.requiresVetRecord && vetRecords.length === 0) {
          this.addingNewVet.set(true);
        }
      });
    }

    if (this.showsConditionPicker) {
      this.conditionsService.getConditions({ petId: this.data.petId }).subscribe(conditions => {
        this.conditions.set(conditions);
      });
    }
  }

  toggleNewVet(): void {
    this.addingNewVet.update(value => !value);
  }

  toggleNewCondition(): void {
    this.addingNewCondition.update(value => !value);
  }

  addAppointmentNote(): void {
    this.appointmentNotes.push(
      this.fb.nonNullable.group({
        type: ['STAFF' as AppointmentNoteType],
        text: ['', Validators.required],
      }),
    );
  }

  removeAppointmentNote(index: number): void {
    this.appointmentNotes.removeAt(index);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.kind === 'CONDITION') {
      this.saveCondition();
    } else if (this.data.existingRecord) {
      this.saveToExistingRecord(this.data.existingRecord);
    } else {
      this.saveMedicalRecord();
    }
  }

  cancel(): void {
    this.sheetRef.dismiss();
  }

  private saveCondition(): void {
    const value = this.form.getRawValue();
    this.saving.set(true);

    this.conditionsService
      .createCondition({
        petId: this.data.petId,
        name: value.conditionName,
        diagnosingPhysician: value.conditionDiagnosingPhysician.trim() || undefined,
        status: value.conditionStatus,
        notes: value.conditionNotes.trim() || undefined,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(() => this.sheetRef.dismiss(true));
  }

  private saveMedicalRecord(): void {
    const value = this.form.getRawValue();

    if (this.requiresVetRecord) {
      if (this.addingNewVet() && !value.newVetOfficeName.trim()) {
        this.form.controls.newVetOfficeName.setErrors({ required: true });
        this.form.controls.newVetOfficeName.markAsTouched();
        return;
      }
      if (!this.addingNewVet() && !value.vetRecordId) {
        this.form.controls.vetRecordId.setErrors({ required: true });
        this.form.controls.vetRecordId.markAsTouched();
        return;
      }
    }

    this.saving.set(true);

    const vetRecordId$ = this.addingNewVet() && value.newVetOfficeName.trim()
      ? this.vetRecordsService
        .createVetRecord({
          officeName: value.newVetOfficeName.trim(),
          address: value.newVetAddress.trim() || undefined,
          phoneNumber: value.newVetPhoneNumber.trim() || undefined,
          hours: value.newVetHours.trim() || undefined,
        })
        .pipe(map(vetRecord => vetRecord.id as string | undefined))
      : of(value.vetRecordId || undefined);

    const conditionId$ = this.resolveConditionId();

    forkJoin([vetRecordId$, conditionId$])
      .pipe(
        switchMap(([vetRecordId, conditionId]) =>
          this.medicalRecordsService.createMedicalRecord(this.buildPayload(vetRecordId, conditionId)),
        ),
        finalize(() => this.saving.set(false)),
      )
      .subscribe(() => this.sheetRef.dismiss(true));
  }

  // Attaches a new vaccine/medication to — or adds/replaces the appointment
  // on — an existing record, rather than creating a new visit.
  private saveToExistingRecord(record: MedicalRecord): void {
    this.saving.set(true);

    this.resolveConditionId()
      .pipe(
        switchMap(conditionId => {
          const value = this.form.getRawValue();
          const payload: UpdateMedicalRecordPayload = {};

          if (this.kind === 'APPOINTMENT' || this.kind === 'NOTE') {
            payload.appointment = {
              time: value.appointmentTime,
              vet: value.appointmentVet.trim() || undefined,
              reason: value.appointmentReason,
              weightLbs: value.appointmentWeightLbs ?? undefined,
              temperatureF: value.appointmentTemperatureF ?? undefined,
              conditionId,
              // 'APPOINTMENT' kind edits scalar fields only and leaves the
              // existing notes list alone (omitted = untouched on the
              // backend). 'NOTE' kind appends one note, resending the full
              // list — replace-not-merge, same as vaccines/medications.
              notes:
                this.kind === 'NOTE'
                  ? [
                    ...record.appointment!.notes.map(note => ({ type: note.type, text: note.text })),
                    { type: value.noteType, text: value.noteText.trim() },
                  ]
                  : undefined,
            };
          } else if (this.kind === 'VACCINE') {
            payload.vaccineRecords = [
              ...record.vaccineRecords.map(vaccine => ({
                name: vaccine.name,
                administeredDate: vaccine.administeredDate,
                nextDueDate: vaccine.nextDueDate ?? undefined,
                notes: vaccine.notes ?? undefined,
              })),
              {
                name: value.vaccineName,
                administeredDate: record.date,
                nextDueDate: value.vaccineNextDueDate.trim() || undefined,
                notes: value.vaccineNotes.trim() || undefined,
              },
            ];
          } else if (this.kind === 'MEDICATION') {
            const editedEntry = {
              conditionId,
              name: value.medicationName,
              dosage: value.medicationDosage.trim() || undefined,
              duration: value.medicationDuration.trim() || undefined,
              prescriber: value.medicationPrescriber.trim() || undefined,
              notes: value.medicationNotes.trim() || undefined,
              status: value.medicationStatus,
            };
            payload.medicationRecords = this.isEditingMedication
              ? record.medicationRecords.map(medication =>
                medication.id === this.data.existingMedicationId
                  ? editedEntry
                  : this.toMedicationPayload(medication),
              )
              : [...record.medicationRecords.map(medication => this.toMedicationPayload(medication)), editedEntry];
          }

          return this.medicalRecordsService.updateMedicalRecord(record.id, payload);
        }),
        finalize(() => this.saving.set(false)),
      )
      .subscribe(() => this.sheetRef.dismiss(true));
  }

  private toMedicationPayload(medication: MedicationRecord): CreateMedicationPayload {
    return {
      conditionId: medication.conditionId ?? undefined,
      name: medication.name,
      dosage: medication.dosage ?? undefined,
      duration: medication.duration ?? undefined,
      prescriber: medication.prescriber ?? undefined,
      notes: medication.notes ?? undefined,
      status: medication.status,
    };
  }

  private resolveConditionId() {
    if (!this.showsConditionPicker) {
      return of(undefined as string | undefined);
    }

    const value = this.form.getRawValue();
    if (this.addingNewCondition()) {
      if (!value.conditionName.trim()) {
        return of(undefined as string | undefined);
      }
      return this.conditionsService
        .createCondition({
          petId: this.data.petId,
          name: value.conditionName.trim(),
          diagnosingPhysician: value.conditionDiagnosingPhysician.trim() || undefined,
          status: value.conditionStatus,
          notes: value.conditionNotes.trim() || undefined,
        })
        .pipe(map(condition => condition.id as string | undefined));
    }
    return of(value.conditionId || undefined);
  }

  private buildPayload(vetRecordId: string | undefined, conditionId?: string): CreateMedicalRecordPayload {
    const value = this.form.getRawValue();

    const payload: CreateMedicalRecordPayload = {
      petId: this.data.petId,
      vetRecordId,
      date: value.date,
      sourceSystem: 'Manual Entry',
    };

    if (this.kind === 'APPOINTMENT') {
      payload.appointment = {
        time: value.appointmentTime,
        vet: value.appointmentVet.trim() || undefined,
        reason: value.appointmentReason,
        weightLbs: value.appointmentWeightLbs ?? undefined,
        temperatureF: value.appointmentTemperatureF ?? undefined,
        notes:
          this.appointmentNotes.length > 0
            ? this.appointmentNotes.controls.map(group => {
              const note = group.getRawValue();
              return { type: note.type, text: note.text };
            })
            : undefined,
        conditionId,
      };
    } else if (this.kind === 'VACCINE') {
      payload.vaccineRecords = [
        {
          name: value.vaccineName,
          administeredDate: value.date,
          nextDueDate: value.vaccineNextDueDate.trim() || undefined,
          notes: value.vaccineNotes.trim() || undefined,
        },
      ];
    } else if (this.kind === 'MEDICATION') {
      payload.medicationRecords = [
        {
          conditionId,
          name: value.medicationName,
          dosage: value.medicationDosage.trim() || undefined,
          duration: value.medicationDuration.trim() || undefined,
          prescriber: value.medicationPrescriber.trim() || undefined,
          notes: value.medicationNotes.trim() || undefined,
          status: value.medicationStatus,
        },
      ];
    }

    return payload;
  }
}
