import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle } from "@angular/material/card";
import { Allergy } from '../../../../models/allergy.model';
import { FormatConstPipe } from '../../../../pipes/format-const.pipe';
import { confirmDelete } from '../../../../utils/delete';
import { PetProfileStore } from '../../pet-profile.store';

@Component({
  selector: 'app-allergy',
  imports: [MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions, MatButton, FormatConstPipe],
  templateUrl: './allergy.html',
  styleUrl: './allergy.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllergyComponent {
  readonly allergies = input.required<Allergy[]>();
  private readonly store = inject(PetProfileStore);
  private readonly bottomSheet = inject(MatBottomSheet);

  protected onDeleteAllergy(allergy: Allergy): void {
    confirmDelete(this.bottomSheet, { title: `Delete ${allergy.allergen} allergy?` }).subscribe(confirmed => {
      if (confirmed) {
        this.store.deleteAllergy(allergy.id);
      }
    });
  }
}
