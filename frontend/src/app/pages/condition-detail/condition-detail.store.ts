import { ComponentType } from '@angular/cdk/portal';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatBottomSheet, MatBottomSheetConfig } from '@angular/material/bottom-sheet';
import { ConditionDetail } from '../../models/condition.model';
import { ConditionsService } from '../../services/conditions.service';
import { MedicalRecordsService } from '../../services/medical-records.service';

@Injectable()
export class ConditionDetailStore {
  private readonly conditionsService = inject(ConditionsService);
  private readonly medicalRecordsService = inject(MedicalRecordsService);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly destroyRef = inject(DestroyRef);

  private conditionId!: string;

  readonly condition = signal<ConditionDetail | null>(null);

  load(conditionId: string): void {
    this.conditionId = conditionId;
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

  removeAppointment(appointmentId: string): void {
    this.medicalRecordsService
      .removeAppointmentCondition(appointmentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reload());
  }

  removeMedication(medicationId: string): void {
    this.medicalRecordsService
      .removeMedicationCondition(medicationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reload());
  }

  deleteCondition(id: string) {
    return this.conditionsService.deleteCondition(id);
  }

  private reload(): void {
    this.conditionsService
      .getCondition(this.conditionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(condition => this.condition.set(condition));
  }
}
