import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MedicalRecord } from '../../models/medical-record.model';
import { MedicalRecordsService } from '../../services/medical-records.service';

@Injectable()
export class VaccineDetailStore {
  private readonly medicalRecordsService = inject(MedicalRecordsService);
  private readonly destroyRef = inject(DestroyRef);

  private petId!: string;

  readonly records = signal<MedicalRecord[] | null>(null);

  load(petId: string): void {
    this.petId = petId;
    this.reload();
  }

  deleteVaccine(id: string): void {
    this.medicalRecordsService
      .deleteVaccine(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reload());
  }

  private reload(): void {
    this.medicalRecordsService
      .getMedicalRecords({ petId: this.petId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(records => this.records.set(records));
  }
}
