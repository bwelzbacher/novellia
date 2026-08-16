import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButton } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { finalize } from 'rxjs';
import { MedicalRecordsService } from '../../../services/medical-records.service';
import { Loading } from '../../loading/loading';

export interface LinkMedicationSheetData {
  petId: string;
  conditionId: string;
  // Medications already linked to this condition — excluded from the
  // picker since linking them again would be a no-op.
  excludeMedicationIds: string[];
}

export interface MedicationOption {
  id: string;
  name: string;
  dosage: string | null;
  date: string;
}

@Component({
  selector: 'app-link-medication-sheet',
  imports: [ReactiveFormsModule, MatFormField, MatLabel, MatError, MatSelect, MatOption, MatButton, Loading, DatePipe],
  templateUrl: './link-medication-sheet.html',
  styleUrl: './link-medication-sheet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkMedicationSheet {
  private readonly data = inject<LinkMedicationSheetData>(MAT_BOTTOM_SHEET_DATA);
  private readonly sheetRef = inject(MatBottomSheetRef<LinkMedicationSheet, boolean>);
  private readonly medicalRecordsService = inject(MedicalRecordsService);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly options = signal<MedicationOption[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    medicationId: ['', Validators.required],
  });

  constructor() {
    this.medicalRecordsService.getMedicalRecords({ petId: this.data.petId }).subscribe(records => {
      const exclude = new Set(this.data.excludeMedicationIds);
      this.options.set(
        records
          .flatMap(record => record.medicationRecords.map(medication => ({ record, medication })))
          .filter(({ medication }) => !exclude.has(medication.id))
          .map(({ record, medication }) => ({
            id: medication.id,
            name: medication.name,
            dosage: medication.dosage,
            date: record.date,
          })),
      );
      this.loading.set(false);
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.medicalRecordsService
      .setMedicationCondition(this.form.getRawValue().medicationId, this.data.conditionId)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(() => this.sheetRef.dismiss(true));
  }

  cancel(): void {
    this.sheetRef.dismiss();
  }
}
