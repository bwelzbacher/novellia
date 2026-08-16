import { LowerCasePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatTab, MatTabGroup, MatTabLabel } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { AddRecordMenu } from '../../components/add-record-menu/add-record-menu';
import { Breadcrumbs } from '../../components/breadcrumbs/breadcrumbs';
import { Loading } from "../../components/loading/loading";
import { PetActionsMenu } from '../../components/pet-actions-menu/pet-actions-menu';
import { API_BASE_URL } from '../../services/pets.service';
import { computePetAge } from '../../utils/pet-age';
import { PetProfileStore } from './pet-profile.store';
import { AllergyComponent } from "./record-tabs/allergy/allergy";
import { ConditionComponent } from './record-tabs/condition/condition';
import { ImmunizationComponent } from "./record-tabs/immunization/immunization";
import { MedicationComponent } from "./record-tabs/medication/medication";
import { NotesComponent } from "./record-tabs/notes/notes";
import { VetVisitComponent } from "./record-tabs/vet-visit/vet-visit";
import { RecordUploadSheet } from '../../components/sheets/record-upload-sheet/record-upload-sheet';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-pet-profile',
  imports: [
    MatIcon,
    MatTabGroup,
    MatTab,
    MatTabLabel,
    MatButton,
    MatMenuTrigger,
    LowerCasePipe,
    TitleCasePipe,
    Loading,
    PetActionsMenu,
    AddRecordMenu,
    VetVisitComponent,
    MedicationComponent,
    ImmunizationComponent,
    NotesComponent,
    ConditionComponent,
    AllergyComponent,
    Breadcrumbs
  ],
  providers: [PetProfileStore],
  templateUrl: './pet-profile.html',
  styleUrl: './pet-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PetProfile {
  private readonly route = inject(ActivatedRoute);
  private readonly bottomSheet = inject(MatBottomSheet);
  protected readonly store = inject(PetProfileStore);

  private readonly petId = this.route.snapshot.paramMap.get('id')!;

  protected readonly pet = this.store.pet;
  protected readonly records = this.store.records;
  protected readonly conditions = this.store.conditions;
  protected readonly allergies = this.store.allergies;

  protected readonly photoUrl = computed(() => {
    const photoUrl = this.pet()?.photoUrl;
    return photoUrl ? `${API_BASE_URL}${photoUrl}` : null;
  });

  protected readonly age = computed(() => computePetAge(this.pet()?.dateOfBirth ?? null));


  protected readonly crumbs = computed(() => {
    const pet = this.pet();

    if (!pet) {
      return [];
    }

    return [{ label: 'Dashboard', routerLink: '/dashboard' }, { label: pet.name }];
  });

  constructor() {
    this.store.load(this.petId);
  }

  protected onUploadDocument(): void {
    this.bottomSheet
      .open(RecordUploadSheet, { data: { petId: this.petId } })
      .afterDismissed()
      .subscribe(saved => {
        if (saved) {
          this.store.reload()
        }
      });
  }
}
