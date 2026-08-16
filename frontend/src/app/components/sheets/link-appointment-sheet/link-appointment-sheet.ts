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

export interface LinkAppointmentSheetData {
  petId: string;
  conditionId: string;
  // Appointments already linked to this condition — excluded from the
  // picker since linking them again would be a no-op.
  excludeAppointmentIds: string[];
}

export interface AppointmentOption {
  id: string;
  reason: string;
  vet: string | null;
  date: string;
}

@Component({
  selector: 'app-link-appointment-sheet',
  imports: [ReactiveFormsModule, MatFormField, MatLabel, MatError, MatSelect, MatOption, MatButton, Loading, DatePipe],
  templateUrl: './link-appointment-sheet.html',
  styleUrl: './link-appointment-sheet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkAppointmentSheet {
  private readonly data = inject<LinkAppointmentSheetData>(MAT_BOTTOM_SHEET_DATA);
  private readonly sheetRef = inject(MatBottomSheetRef<LinkAppointmentSheet, boolean>);
  private readonly medicalRecordsService = inject(MedicalRecordsService);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly options = signal<AppointmentOption[]>([]);

  protected readonly form = this.fb.nonNullable.group({
    appointmentId: ['', Validators.required],
  });

  constructor() {
    this.medicalRecordsService.getMedicalRecords({ petId: this.data.petId }).subscribe(records => {
      const exclude = new Set(this.data.excludeAppointmentIds);
      this.options.set(
        records
          .filter(record => record.appointment && !exclude.has(record.appointment.id))
          .map(record => ({
            id: record.appointment!.id,
            reason: record.appointment!.reason,
            vet: record.appointment!.vet,
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
      .setAppointmentCondition(this.form.getRawValue().appointmentId, this.data.conditionId)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(() => this.sheetRef.dismiss(true));
  }

  cancel(): void {
    this.sheetRef.dismiss();
  }
}
