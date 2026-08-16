import { NgTemplateOutlet, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatOption } from '@angular/material/core';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatMenu, MatMenuContent, MatMenuTrigger } from '@angular/material/menu';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSelect } from '@angular/material/select';
import { debounceTime, distinctUntilChanged, map, switchMap } from 'rxjs';
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
    MatProgressSpinner,
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

  // Debounced so typing a name doesn't fire a request per keystroke.
  private readonly debouncedNameFilter = toSignal(
    toObservable(this.nameFilter).pipe(debounceTime(300), distinctUntilChanged()),
    { initialValue: '' },
  );

  // Name and species are filtered server-side, so this also drives
  // pagination: fetches page 1 whenever refreshTick, name, or species
  // changes. Subsequent pages are appended by loadMorePets().
  private readonly petsQuery = computed(() => ({
    tick: this.refreshTick(),
    name: this.debouncedNameFilter(),
    species: this.speciesFilter(),
  }));

  private readonly firstPage = toSignal(
    toObservable(this.petsQuery).pipe(
      switchMap(({ name, species }) =>
        this.petsService
          .getPets({ name: name || undefined, species: species || undefined })
          .pipe(map(result => ({ result, name, species }))),
      ),
      takeUntilDestroyed(this.destroyRef),
    ),
    { initialValue: null },
  );

  protected readonly petsSignal = signal<Pet[] | null>(null);
  private readonly currentPetsPage = signal(1);
  private readonly totalPetsPages = signal(1);
  protected readonly loadingMorePets = signal(false);
  protected readonly hasMorePets = computed(() => this.currentPetsPage() < this.totalPetsPages());

  // Whether the user has any pets at all, independent of the active
  // name/species filter — only updated from an unfiltered fetch, so a
  // filtered-to-zero result doesn't hide the sidebar/filters.
  protected readonly hasAnyPets = signal<boolean | null>(null);

  constructor() {
    effect(() => {
      const payload = this.firstPage();
      if (payload) {
        const { result, name, species } = payload;
        this.petsSignal.set(result.data);
        this.currentPetsPage.set(result.page);
        this.totalPetsPages.set(result.totalPages);
        if (!name && !species) {
          this.hasAnyPets.set(result.total > 0);
        }
      }
    });
  }

  protected loadMorePets(): void {
    if (this.loadingMorePets() || !this.hasMorePets()) {
      return;
    }
    this.loadingMorePets.set(true);
    const nextPage = this.currentPetsPage() + 1;
    const { name, species } = this.petsQuery();
    this.petsService
      .getPets({ name: name || undefined, species: species || undefined, page: nextPage })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.petsSignal.update(pets => [...(pets ?? []), ...result.data]);
          this.currentPetsPage.set(result.page);
          this.totalPetsPages.set(result.totalPages);
          this.loadingMorePets.set(false);
        },
        error: () => this.loadingMorePets.set(false),
      });
  }

  protected onPetGridScroll(event: Event): void {
    const target = event.target as HTMLElement;
    const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 200;
    if (nearBottom) {
      this.loadMorePets();
    }
  }

  // Name and species are filtered server-side (see petsQuery); only the
  // record-derived filters are applied client-side here.
  protected readonly filteredPets = computed(() => {
    const pets = this.petsSignal();
    const needsMissingDetails = this.missingDetailsFilter();
    const needsUpcoming = this.upcomingFilter();

    return pets?.filter(pet => {
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
