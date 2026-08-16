import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButton } from '@angular/material/button';

export interface ConfirmDeleteSheetData {
  title: string;
  message?: string;
}

@Component({
  selector: 'app-confirm-delete-sheet',
  imports: [MatButton],
  templateUrl: './confirm-delete-sheet.html',
  styleUrl: './confirm-delete-sheet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeleteSheet {
  protected readonly data = inject<ConfirmDeleteSheetData>(MAT_BOTTOM_SHEET_DATA);
  private readonly sheetRef = inject(MatBottomSheetRef<ConfirmDeleteSheet, boolean>);

  cancel(): void {
    this.sheetRef.dismiss();
  }

  confirm(): void {
    this.sheetRef.dismiss(true);
  }
}
