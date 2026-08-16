import { NgTemplateOutlet, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatOption } from '@angular/material/core';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatMenu, MatMenuContent, MatMenuTrigger } from '@angular/material/menu';
import { MatSelect } from '@angular/material/select';
import { map, switchMap } from 'rxjs';
import { PetCard } from '../../components/pet-card/pet-card';
import { PetFormSheet } from '../../components/sheets/pet-form-sheet/pet-form-sheet';
import { MedicalRecord } from '../../models/medical-record.model';
import { PET_SPECIES, Pet, PetSpecies } from '../../models/pet.model';
import { MedicalRecordsService } from '../../services/medical-records.service';
import { PetsService } from '../../services/pets.service';
import { computePetBadges } from '../../utils/pet-badges';
import { MatIcon } from '@angular/material/icon';
import { Loading } from "../../components/loading/loading";

@Component({
  selector: 'app-dashboard',
  imports: [
    MatButton,
    PetCard,
    FormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatSelect,
    MatOption,
    MatCheckbox,
    TitleCasePipe,
    MatIcon,
    Loading,
    NgTemplateOutlet,
    MatMenu,
    MatMenuTrigger,
    MatMenuContent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly petsService = inject(PetsService);
  private readonly medicalRecordsService = inject(MedicalRecordsService);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly petSpecies = PET_SPECIES;
  protected readonly nameFilter = signal('');
  protected readonly speciesFilter = signal<PetSpecies | ''>('');
  protected readonly missingDetailsFilter = signal(false);
  protected readonly upcomingFilter = signal(false);
  private readonly refreshTick = signal(0);

  readonly pets = toObservable(this.refreshTick).pipe(
    switchMap(() => this.petsService.getPets()),
    map(result => result.data),
    takeUntilDestroyed(this.destroyRef),
  );

  protected readonly petsSignal = toSignal(this.pets, { initialValue: null });

  protected readonly filteredPets = computed(() => {
    const pets = this.petsSignal();
    const name = this.nameFilter().trim().toLowerCase();
    const species = this.speciesFilter();
    const needsMissingDetails = this.missingDetailsFilter();
    const needsUpcoming = this.upcomingFilter();

    return pets?.filter(pet => {
      if (name && !pet.name.toLowerCase().includes(name)) {
        return false;
      }
      if (species && pet.species !== species) {
        return false;
      }
      // Missing-details / upcoming aren't fields on Pet — they're derived
      // from a pet's medical records — so this uses the same badge logic
      // the pet cards already use.
      if (needsMissingDetails || needsUpcoming) {
        const variants = new Set(
          computePetBadges(pet, this.recordsForPet(pet.id)).map(badge => badge.variant),
        );
        if (needsMissingDetails && !variants.has('overdue')) {
          return false;
        }
        if (needsUpcoming && !variants.has('upcoming')) {
          return false;
        }
      }
      return true;
    });
  });

  private readonly allRecords = toSignal(
    toObservable(this.refreshTick).pipe(switchMap(() => this.medicalRecordsService.getMedicalRecords())),
    { initialValue: [] as MedicalRecord[] },
  );

  private readonly recordsByPetId = computed(() => {
    const map = new Map<string, MedicalRecord[]>();
    for (const record of this.allRecords()) {
      const list = map.get(record.petId) ?? [];
      list.push(record);
      map.set(record.petId, list);
    }
    return map;
  });

  protected recordsForPet(petId: string): MedicalRecord[] {
    return this.recordsByPetId().get(petId) ?? [];
  }

  protected refresh(): void {
    this.refreshTick.update(tick => tick + 1);
  }

  protected onAddPet(): void {
    this.bottomSheet
      .open(PetFormSheet, { data: {} })
      .afterDismissed()
      .subscribe(saved => {
        if (saved) {
          this.refresh();
        }
      });
  }

  protected resetFilters(): void {
    this.nameFilter.set('');
    this.speciesFilter.set('');
    this.missingDetailsFilter.set(false);
    this.upcomingFilter.set(false);
  }
}
