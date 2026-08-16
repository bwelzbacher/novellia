import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButton } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { finalize, map, of, switchMap } from 'rxjs';
import { VetRecord } from '../../../models/vet-record.model';
import { MedicalRecordsService } from '../../../services/medical-records.service';
import { VetRecordsService } from '../../../services/vet-records.service';

export interface VetOfficeFormSheetData {
  medicalRecordId: string;
  vetRecordId: string | null;
}

@Component({
  selector: 'app-vet-office-form-sheet',
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
  ],
  templateUrl: './vet-office-form-sheet.html',
  styleUrl: './vet-office-form-sheet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VetOfficeFormSheet {
  private readonly data = inject<VetOfficeFormSheetData>(MAT_BOTTOM_SHEET_DATA);
  private readonly sheetRef = inject(MatBottomSheetRef<VetOfficeFormSheet, boolean>);
  private readonly vetRecordsService = inject(VetRecordsService);
  private readonly medicalRecordsService = inject(MedicalRecordsService);
  private readonly fb = inject(FormBuilder);

  protected readonly saving = signal(false);
  protected readonly addingNewVet = signal(false);
  protected readonly vetRecords = signal<VetRecord[]>([]);
  protected readonly isEditing = !!this.data.vetRecordId;

  protected readonly form = this.fb.nonNullable.group({
    vetRecordId: [this.data.vetRecordId ?? ''],
    newVetOfficeName: [''],
    newVetAddress: [''],
    newVetPhoneNumber: [''],
    newVetHours: [''],
  });

  constructor() {
    this.vetRecordsService.getVetRecords().subscribe(vetRecords => {
      this.vetRecords.set(vetRecords);
      if (vetRecords.length === 0) {
        this.addingNewVet.set(true);
      }
    });
  }

  toggleNewVet(): void {
    this.addingNewVet.update(value => !value);
  }

  save(): void {
    const value = this.form.getRawValue();

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

    this.saving.set(true);

    const vetRecordId$ = this.addingNewVet()
      ? this.vetRecordsService
        .createVetRecord({
          officeName: value.newVetOfficeName.trim(),
          address: value.newVetAddress.trim() || undefined,
          phoneNumber: value.newVetPhoneNumber.trim() || undefined,
          hours: value.newVetHours.trim() || undefined,
        })
        .pipe(map(vetRecord => vetRecord.id))
      : of(value.vetRecordId);

    vetRecordId$
      .pipe(
        switchMap(vetRecordId =>
          this.medicalRecordsService.updateMedicalRecord(this.data.medicalRecordId, { vetRecordId }),
        ),
        finalize(() => this.saving.set(false)),
      )
      .subscribe(() => this.sheetRef.dismiss(true));
  }

  cancel(): void {
    this.sheetRef.dismiss();
  }
}
