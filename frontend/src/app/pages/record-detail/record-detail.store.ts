import { ComponentType } from '@angular/cdk/portal';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatBottomSheet, MatBottomSheetConfig } from '@angular/material/bottom-sheet';
import { MedicalRecord } from '../../models/medical-record.model';
import { MedicalRecordsService } from '../../services/medical-records.service';

@Injectable()
export class RecordDetailStore {
  private readonly medicalRecordsService = inject(MedicalRecordsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly bottomSheet = inject(MatBottomSheet);

  private recordId!: string;

  readonly record = signal<MedicalRecord | null>(null);
  readonly loading = signal(false);

  load(recordId: string): void {
    this.recordId = recordId;
    this.reload();
  }

  openSheet<T>(component: ComponentType<T>, config?: MatBottomSheetConfig): void {
    this.bottomSheet
      .open<T, unknown, boolean>(component, config)
      .afterDismissed()
      .subscribe(saved => {
        if (saved) {
          this.reload();
        }
      });
  }

  deleteVaccine(id: string): void {
    this.medicalRecordsService
      .deleteVaccine(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reload());
  }

  deleteMedication(id: string): void {
    this.medicalRecordsService
      .deleteMedication(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reload());
  }

  deleteAppointmentNote(id: string): void {
    this.medicalRecordsService
      .deleteAppointmentNote(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reload());
  }

  deleteRecord(id: string) {
    return this.medicalRecordsService.deleteMedicalRecord(id);
  }

  private reload(): void {
    this.loading.set(true);
    this.medicalRecordsService
      .getMedicalRecord(this.recordId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(record => {
        this.record.set(record);
        this.loading.set(false);
      });
  }
}
