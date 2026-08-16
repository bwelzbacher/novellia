import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { VaccineRecord } from '../../models/medical-record.model';
import { Pet } from '../../models/pet.model';
import { PetsService } from '../../services/pets.service';
import { Loading } from '../../components/loading/loading';
import { confirmDelete } from '../../utils/delete';
import { VaccineDetailStore } from './vaccine-detail.store';
import { Breadcrumbs, Crumb } from "../../components/breadcrumbs/breadcrumbs";

@Component({
  selector: 'app-vaccine-detail',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatCardActions,
    MatIcon,
    MatButton,
    DatePipe,
    RouterLink,
    Loading,
    Breadcrumbs
  ],
  providers: [VaccineDetailStore],
  templateUrl: './vaccine-detail.html',
  styleUrl: './vaccine-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VaccineDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly petsService = inject(PetsService);
  private readonly store = inject(VaccineDetailStore);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly petId = this.route.snapshot.paramMap.get('petId')!;
  protected readonly vaccineName = this.route.snapshot.paramMap.get('vaccineName')!;

  protected readonly pet = signal<Pet | null>(null);
  private readonly records = this.store.records;

  // Every dose of this specific vaccine across the pet's records, newest
  // first. No dedicated backend endpoint — reuses the pet's full medical
  // record list and filters client-side by name.
  protected readonly doses = computed(() => {
    const records = this.records();
    if (!records) {
      return null;
    }
    return records
      .flatMap(record =>
        record.vaccineRecords.filter(vaccine => vaccine.name === this.vaccineName).map(vaccine => ({ record, vaccine })),
      )
      .sort((a, b) => new Date(b.vaccine.administeredDate).getTime() - new Date(a.vaccine.administeredDate).getTime());
  });

  protected readonly crumbs = computed(() => {
    const pet = this.pet();

    if (!pet) {
      return [];
    }

    return [{ label: 'Dashboard', routerLink: '/dashboard' }, { label: pet.name, routerLink: ['/pets', pet.id] }, { label: this.vaccineName }];
  });

  constructor() {
    this.petsService
      .getPet(this.petId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(pet => this.pet.set(pet));

    this.store.load(this.petId);
  }

  protected onDeleteVaccine(vaccine: VaccineRecord): void {
    confirmDelete(this.bottomSheet, { title: `Delete this dose of ${vaccine.name}?` }).subscribe(confirmed => {
      if (confirmed) {
        this.store.deleteVaccine(vaccine.id);
      }
    });
  }
}
