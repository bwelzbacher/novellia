import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { filter, switchMap } from 'rxjs';
import { DeletePetSheet, DeletePetSheetResult } from '../sheets/delete-pet-sheet/delete-pet-sheet';
import { PetFormSheet } from '../sheets/pet-form-sheet/pet-form-sheet';
import { Pet, PetId } from '../../models/pet.model';
import { PetsService } from '../../services/pets.service';
import { AddRecordMenu } from "../add-record-menu/add-record-menu";
import { Router } from '@angular/router';

@Component({
  selector: 'app-pet-actions-menu',
  imports: [MatIconButton, MatIcon, MatMenu, MatMenuItem, MatMenuTrigger, AddRecordMenu],
  templateUrl: './pet-actions-menu.html',
  styleUrl: './pet-actions-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PetActionsMenu {
  readonly showMedicalRecord = input<boolean>(true);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly petsService = inject(PetsService);
  private readonly router = inject(Router);

  readonly pet = input.required<Pet>();
  readonly triggerRefresh = output<void>();

  protected onEdit(): void {
    this.bottomSheet
      .open(PetFormSheet, { data: { petId: this.pet().id } })
      .afterDismissed()
      .subscribe(saved => {
        if (saved) {
          this.triggerRefresh.emit();
        }
      });
  }

  protected onDelete(): void {
    const pet = this.pet();
    this.bottomSheet
      .open(DeletePetSheet, { data: { petName: pet.name } })
      .afterDismissed()
      .pipe(
        filter((result): result is DeletePetSheetResult => !!result),
        switchMap(result => this.petsService.deactivatePet(pet.id, result.reason)),
      )
      .subscribe(() => { this.router.navigate(['/dashboard']); this.triggerRefresh.emit(); });
  }
}
