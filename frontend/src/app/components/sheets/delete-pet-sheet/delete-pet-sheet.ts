import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButton } from '@angular/material/button';
import { MatRadioButton, MatRadioChange, MatRadioGroup } from '@angular/material/radio';
import { PetInactiveReason } from '../../../models/pet.model';

interface DeletePetSheetData {
  petName: string;
}

export interface DeletePetSheetResult {
  reason: PetInactiveReason | null;
}

interface ReasonOption {
  value: PetInactiveReason;
  label: string;
}

const REASON_OPTIONS: ReasonOption[] = [
  { value: 'DECEASED', label: 'Deceased' },
  { value: 'REHOMED', label: 'Rehomed' },
  { value: 'OTHER', label: 'Other' },
];

@Component({
  selector: 'app-delete-pet-sheet',
  imports: [MatRadioGroup, MatRadioButton, MatButton],
  templateUrl: './delete-pet-sheet.html',
  styleUrl: './delete-pet-sheet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeletePetSheet {
  protected readonly data = inject<DeletePetSheetData>(MAT_BOTTOM_SHEET_DATA);
  private readonly sheetRef = inject(MatBottomSheetRef<DeletePetSheet, DeletePetSheetResult>);

  protected readonly reasons = REASON_OPTIONS;
  protected readonly selectedReason = signal<PetInactiveReason | null>(null);

  onReasonChange(change: MatRadioChange): void {
    this.selectedReason.set(change.value);
  }

  cancel(): void {
    this.sheetRef.dismiss();
  }

  confirm(): void {
    this.sheetRef.dismiss({ reason: this.selectedReason() });
  }
}
