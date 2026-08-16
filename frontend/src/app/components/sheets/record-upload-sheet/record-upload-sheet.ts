import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButton } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatSelect } from '@angular/material/select';
import { finalize, forkJoin, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Condition, CONDITION_STATUSES, ConditionStatus } from '../../../models/condition.model';
import {
  APPOINTMENT_NOTE_TYPES,
  AppointmentNoteType,
  CreateMedicalRecordPayload,
} from '../../../models/medical-record.model';
import { RecordExtractionDraft } from '../../../models/record-extraction.model';
import { VetRecord } from '../../../models/vet-record.model';
import { FormatConstPipe } from '../../../pipes/format-const.pipe';
import { ConditionsService } from '../../../services/conditions.service';
import { MedicalRecordsService } from '../../../services/medical-records.service';
import { RecordExtractionService } from '../../../services/record-extraction.service';
import { VetRecordsService } from '../../../services/vet-records.service';
import { dateNotInFuture, dateNotInPast } from '../../../utils/date-validators';

export interface RecordUploadSheetData {
  petId: string;
}

type ConditionGroup = FormGroup<{
  name: FormControl<string>;
  diagnosingPhysician: FormControl<string>;
  status: FormControl<ConditionStatus>;
  notes: FormControl<string>;
  useExisting: FormControl<boolean>;
  existingId: FormControl<string>;
}>;

type VaccineGroup = FormGroup<{
  name: FormControl<string>;
  nextDueDate: FormControl<string>;
  notes: FormControl<string>;
}>;

type MedicationGroup = FormGroup<{
  name: FormControl<string>;
  dosage: FormControl<string>;
  duration: FormControl<string>;
  prescriber: FormControl<string>;
  notes: FormControl<string>;
  conditionKey: FormControl<string>;
}>;

interface ConditionRow {
  key: string;
  group: ConditionGroup;
}

@Component({
  selector: 'app-record-upload-sheet',
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
    MatProgressSpinner,
    FormatConstPipe
  ],
  templateUrl: './record-upload-sheet.html',
  styleUrl: './record-upload-sheet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordUploadSheet {
  private readonly data = inject<RecordUploadSheetData>(MAT_BOTTOM_SHEET_DATA);
  private readonly sheetRef = inject(MatBottomSheetRef<RecordUploadSheet, boolean>);
  private readonly recordExtractionService = inject(RecordExtractionService);
  private readonly vetRecordsService = inject(VetRecordsService);
  private readonly conditionsService = inject(ConditionsService);
  private readonly medicalRecordsService = inject(MedicalRecordsService);
  private readonly fb = inject(FormBuilder);

  protected readonly step = signal<'upload' | 'review'>('upload');
  protected readonly extracting = signal(false);
  protected readonly extractError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly warnings = signal<string[]>([]);

  protected readonly addingNewVet = signal(false);
  protected readonly vetRecords = signal<VetRecord[]>([]);
  protected readonly existingConditions = signal<Condition[]>([]);
  protected readonly conditionStatuses = CONDITION_STATUSES;
  protected readonly conditionRows = signal<ConditionRow[]>([]);
  protected readonly appointmentNoteTypes = APPOINTMENT_NOTE_TYPES;

  private selectedFile: File | null = null;

  protected readonly form = this.fb.nonNullable.group({
    vetRecordId: [''],
    newVetOfficeName: [''],
    newVetAddress: [''],
    newVetPhoneNumber: [''],
    date: ['', [Validators.required, dateNotInFuture]],
    appointmentTime: [''],
    appointmentVet: [''],
    appointmentReason: [''],
    appointmentNoteType: ['DISCHARGE' as AppointmentNoteType],
    appointmentSummaryNotes: [''],
    appointmentWeightLbs: this.fb.control<number | null>(null),
    appointmentTemperatureF: this.fb.control<number | null>(null),
  });

  protected readonly vaccines = this.fb.array<VaccineGroup>([]);
  protected readonly medications = this.fb.array<MedicationGroup>([]);

  constructor() {
    this.vetRecordsService.getVetRecords().subscribe((vetRecords) => this.vetRecords.set(vetRecords));
    this.conditionsService
      .getConditions({ petId: this.data.petId })
      .subscribe((conditions) => this.existingConditions.set(conditions));
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    this.selectedFile = file;
    this.extract();
  }

  backToUpload(): void {
    this.step.set('upload');
    this.extractError.set(null);
  }

  toggleNewVet(): void {
    this.addingNewVet.update((value) => !value);
  }

  addConditionRow(): void {
    this.conditionRows.update((rows) => [
      ...rows,
      this.makeConditionRow(crypto.randomUUID(), '', null, null, 'ACTIVE', null),
    ]);
  }

  removeConditionRow(key: string): void {
    this.conditionRows.update((rows) => rows.filter((row) => row.key !== key));
    for (const medication of this.medications.controls) {
      if (medication.controls.conditionKey.value === key) {
        medication.controls.conditionKey.setValue('');
      }
    }
  }

  addVaccine(): void {
    this.vaccines.push(
      this.fb.nonNullable.group({
        name: ['', Validators.required],
        nextDueDate: ['', dateNotInPast],
        notes: [''],
      }),
    );
  }

  removeVaccine(index: number): void {
    this.vaccines.removeAt(index);
  }

  addMedication(): void {
    this.medications.push(
      this.fb.nonNullable.group({
        name: ['', Validators.required],
        dosage: [''],
        duration: [''],
        prescriber: [''],
        notes: [''],
        conditionKey: [''],
      }),
    );
  }

  removeMedication(index: number): void {
    this.medications.removeAt(index);
  }

  cancel(): void {
    this.sheetRef.dismiss();
  }

  save(): void {
    if (!this.validate()) {
      return;
    }

    this.saving.set(true);

    const vetRecordId$ = this.addingNewVet()
      ? this.vetRecordsService
        .createVetRecord({
          officeName: this.form.controls.newVetOfficeName.value.trim(),
          address: this.form.controls.newVetAddress.value.trim() || undefined,
          phoneNumber: this.form.controls.newVetPhoneNumber.value.trim() || undefined,
        })
        .pipe(map((vetRecord) => vetRecord.id))
      : of(this.form.controls.vetRecordId.value);

    forkJoin([vetRecordId$, this.resolveConditionIds()])
      .pipe(
        switchMap(([vetRecordId, conditionIdsByKey]) =>
          this.medicalRecordsService.createMedicalRecord(this.buildPayload(vetRecordId, conditionIdsByKey)),
        ),
        finalize(() => this.saving.set(false)),
      )
      .subscribe(() => this.sheetRef.dismiss(true));
  }

  private extract(): void {
    if (!this.selectedFile) {
      return;
    }
    this.extracting.set(true);
    this.extractError.set(null);

    this.recordExtractionService
      .extract(this.data.petId, this.selectedFile)
      .pipe(finalize(() => this.extracting.set(false)))
      .subscribe({
        next: (draft) => this.applyDraft(draft),
        error: () =>
          this.extractError.set(
            "Couldn't read that document. Try a clearer photo, or enter this record manually.",
          ),
      });
  }

  private applyDraft(draft: RecordExtractionDraft): void {
    this.warnings.set(draft.warnings);
    this.addingNewVet.set(draft.vetRecord.isNew);
    this.form.patchValue({
      vetRecordId: draft.vetRecord.id ?? '',
      newVetOfficeName: draft.vetRecord.name,
      newVetAddress: draft.vetRecord.address ?? '',
      newVetPhoneNumber: draft.vetRecord.phone ?? '',
      date: draft.date ?? '',
      appointmentTime: draft.appointment.time,
      appointmentVet: draft.appointment.vet,
      appointmentReason: draft.appointment.reason,
      appointmentSummaryNotes: draft.appointment.summaryNotes,
      appointmentWeightLbs: this.parseNumber(draft.appointment.weight),
      appointmentTemperatureF: this.parseNumber(draft.appointment.temperature),
    });

    this.vaccines.clear();
    for (const vaccine of draft.vaccineRecords) {
      this.vaccines.push(
        this.fb.nonNullable.group({
          name: [vaccine.name, Validators.required],
          nextDueDate: [vaccine.nextDueDate, dateNotInPast],
          notes: [vaccine.notes],
        }),
      );
    }

    this.conditionRows.set(this.buildConditionRows(draft));

    this.medications.clear();
    for (const medication of draft.medicationRecords) {
      const key = medication.condition ? this.normalize(medication.condition.name) : '';
      this.medications.push(
        this.fb.nonNullable.group({
          name: [medication.name, Validators.required],
          dosage: [medication.dosage ?? ''],
          duration: [medication.duration ?? ''],
          prescriber: [medication.prescriber ?? ''],
          notes: [medication.notes ?? ''],
          conditionKey: [key],
        }),
      );
    }

    this.step.set('review');
  }

  // Deduped by case/whitespace-insensitive name across conditionsReferenced
  // and every medication's conditionName — see the equivalent backend logic
  // in record-extraction.service.ts.
  private buildConditionRows(draft: RecordExtractionDraft): ConditionRow[] {
    const rows: ConditionRow[] = [];
    const seen = new Set<string>();

    for (const condition of draft.conditionsReferenced) {
      const key = this.normalize(condition.name);
      seen.add(key);
      rows.push(
        this.makeConditionRow(
          key,
          condition.name,
          condition.resolved.id,
          condition.diagnosingPhysician,
          condition.status,
          condition.notes,
        ),
      );
    }

    for (const medication of draft.medicationRecords) {
      if (!medication.condition) {
        continue;
      }
      const key = this.normalize(medication.condition.name);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      rows.push(this.makeConditionRow(key, medication.condition.name, medication.condition.id, null, 'ACTIVE', null));
    }

    return rows;
  }

  private makeConditionRow(
    key: string,
    name: string,
    existingId: string | null,
    diagnosingPhysician: string | null,
    status: ConditionStatus,
    notes: string | null,
  ): ConditionRow {
    return {
      key,
      group: this.fb.nonNullable.group({
        name: [name, Validators.required],
        diagnosingPhysician: [diagnosingPhysician ?? ''],
        status: [status],
        notes: [notes ?? ''],
        useExisting: [!!existingId],
        existingId: [existingId ?? ''],
      }),
    };
  }

  private parseNumber(value: string): number | null {
    const parsed = Number(value);
    return value.trim() && !isNaN(parsed) ? parsed : null;
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }

  private validate(): boolean {
    let valid = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      valid = false;
    }

    if (this.addingNewVet() && !this.form.controls.newVetOfficeName.value.trim()) {
      this.form.controls.newVetOfficeName.setErrors({ required: true });
      this.form.controls.newVetOfficeName.markAsTouched();
      valid = false;
    }
    if (!this.addingNewVet() && !this.form.controls.vetRecordId.value) {
      this.form.controls.vetRecordId.setErrors({ required: true });
      this.form.controls.vetRecordId.markAsTouched();
      valid = false;
    }

    const value = this.form.getRawValue();
    const appointmentStarted =
      !!value.appointmentTime.trim() || !!value.appointmentVet.trim() || !!value.appointmentReason.trim();
    if (appointmentStarted) {
      if (!value.appointmentTime.trim()) {
        this.form.controls.appointmentTime.setErrors({ required: true });
        valid = false;
      }
      if (!value.appointmentReason.trim()) {
        this.form.controls.appointmentReason.setErrors({ required: true });
        valid = false;
      }
      this.form.markAllAsTouched();
    }

    for (const row of this.conditionRows()) {
      const rowValue = row.group.getRawValue();
      if (rowValue.useExisting && !rowValue.existingId) {
        row.group.controls.existingId.setErrors({ required: true });
        valid = false;
      }
      if (!rowValue.useExisting && !rowValue.name.trim()) {
        row.group.controls.name.setErrors({ required: true });
        valid = false;
      }
      row.group.markAllAsTouched();
    }

    return valid;
  }

  private resolveConditionIds(): Observable<Map<string, string>> {
    const rows = this.conditionRows();
    if (rows.length === 0) {
      return of(new Map());
    }

    const requests = rows.map((row) => {
      const value = row.group.getRawValue();
      if (value.useExisting) {
        return of([row.key, value.existingId] as [string, string]);
      }
      return this.conditionsService
        .createCondition({
          petId: this.data.petId,
          name: value.name.trim(),
          diagnosingPhysician: value.diagnosingPhysician.trim() || undefined,
          status: value.status,
          notes: value.notes.trim() || undefined,
        })
        .pipe(map((condition) => [row.key, condition.id] as [string, string]));
    });

    return forkJoin(requests).pipe(map((pairs) => new Map(pairs)));
  }

  private buildPayload(
    vetRecordId: string,
    conditionIdsByKey: Map<string, string>,
  ): CreateMedicalRecordPayload {
    const value = this.form.getRawValue();

    const payload: CreateMedicalRecordPayload = {
      petId: this.data.petId,
      vetRecordId,
      date: value.date,
      sourceSystem: 'AI Extraction',
    };

    if (value.appointmentReason.trim()) {
      payload.appointment = {
        time: value.appointmentTime,
        vet: value.appointmentVet.trim() || undefined,
        reason: value.appointmentReason,
        weightLbs: value.appointmentWeightLbs ?? undefined,
        temperatureF: value.appointmentTemperatureF ?? undefined,
        notes: value.appointmentSummaryNotes.trim()
          ? [{ type: value.appointmentNoteType, text: value.appointmentSummaryNotes.trim() }]
          : undefined,
      };
    }

    if (this.vaccines.length > 0) {
      payload.vaccineRecords = this.vaccines.controls.map((group) => {
        const vaccine = group.getRawValue();
        return {
          name: vaccine.name,
          administeredDate: value.date,
          nextDueDate: vaccine.nextDueDate.trim() || undefined,
          notes: vaccine.notes.trim() || undefined,
        };
      });
    }

    if (this.medications.length > 0) {
      payload.medicationRecords = this.medications.controls.map((group) => {
        const medication = group.getRawValue();
        return {
          conditionId: conditionIdsByKey.get(medication.conditionKey) || undefined,
          name: medication.name,
          dosage: medication.dosage.trim() || undefined,
          duration: medication.duration.trim() || undefined,
          prescriber: medication.prescriber.trim() || undefined,
          notes: medication.notes.trim() || undefined,
        };
      });
    }

    return payload;
  }
}
