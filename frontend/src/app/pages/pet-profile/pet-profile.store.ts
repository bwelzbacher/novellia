import { ComponentType } from '@angular/cdk/portal';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatBottomSheet, MatBottomSheetConfig } from '@angular/material/bottom-sheet';
import { Allergy } from '../../models/allergy.model';
import { Condition } from '../../models/condition.model';
import { MedicalRecord } from '../../models/medical-record.model';
import { Pet } from '../../models/pet.model';
import { AllergiesService } from '../../services/allergies.service';
import { ConditionsService } from '../../services/conditions.service';
import { MedicalRecordsService } from '../../services/medical-records.service';
import { PetsService } from '../../services/pets.service';

@Injectable()
export class PetProfileStore {
  private readonly petsService = inject(PetsService);
  private readonly medicalRecordsService = inject(MedicalRecordsService);
  private readonly conditionsService = inject(ConditionsService);
  private readonly allergiesService = inject(AllergiesService);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly destroyRef = inject(DestroyRef);

  private petId!: string;

  readonly pet = signal<Pet | null>(null);
  readonly records = signal<MedicalRecord[]>([]);
  readonly conditions = signal<Condition[]>([]);
  readonly allergies = signal<Allergy[]>([]);

  load(petId: string): void {
    this.petId = petId;
    this.reloadPet();
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

  deleteMedication(id: string): void {
    this.medicalRecordsService
      .deleteMedication(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reload());
  }

  deleteAllergy(id: string): void {
    this.allergiesService
      .deleteAllergy(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reload());
  }

  reloadPet(): void {
    this.petsService
      .getPet(this.petId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(pet => this.pet.set(pet));
  }

  reload(): void {
    this.medicalRecordsService
      .getMedicalRecords({ petId: this.petId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(records => this.records.set(records));

    this.conditionsService
      .getConditions({ petId: this.petId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(conditions => this.conditions.set(conditions));

    this.allergiesService
      .getAllergies({ petId: this.petId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(allergies => this.allergies.set(allergies));
  }
}
