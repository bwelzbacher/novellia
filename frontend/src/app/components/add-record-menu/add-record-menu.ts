import { ChangeDetectionStrategy, Component, inject, input, output, viewChild } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem } from '@angular/material/menu';
import { AllergyFormSheet } from '../sheets/allergy-form-sheet/allergy-form-sheet';
import { MedicalRecordFormSheet } from '../sheets/medical-record-form-sheet/medical-record-form-sheet';
import { RecordUploadSheet } from '../sheets/record-upload-sheet/record-upload-sheet';
import { RecordKind } from '../../models/medical-record.model';
import { PetId } from '../../models/pet.model';

@Component({
  selector: 'app-add-record-menu',
  imports: [MatIcon, MatMenu, MatMenuItem],
  templateUrl: './add-record-menu.html',
  styleUrl: './add-record-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddRecordMenu {
  private readonly bottomSheet = inject(MatBottomSheet);
  readonly petId = input.required<PetId>();
  readonly triggerRefresh = output<void>();

  // Trigger buttons differ per host (icon-only on the compact pet card,
  // a labeled CTA on the profile page), so hosts supply their own button
  // and bind [matMenuTriggerFor]="addRecordMenu.menu()" to this.
  readonly menu = viewChild.required(MatMenu);

  protected onAddRecord(kind: RecordKind, date?: string): void {
    this.bottomSheet
      .open(MedicalRecordFormSheet, { data: { petId: this.petId(), kind, date } })
      .afterDismissed()
      .subscribe(saved => {
        if (saved) {
          this.triggerRefresh.emit();
        }
      });
  }

  protected onAddUpcomingAppointment(): void {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    this.onAddRecord('APPOINTMENT', date.toISOString().substring(0, 10));
  }

  protected onUploadDocument(): void {
    this.bottomSheet
      .open(RecordUploadSheet, { data: { petId: this.petId() } })
      .afterDismissed()
      .subscribe(saved => {
        if (saved) {
          this.triggerRefresh.emit();
        }
      });
  }

  protected onAddAllergy(): void {
    this.bottomSheet
      .open(AllergyFormSheet, { data: { petId: this.petId() } })
      .afterDismissed()
      .subscribe(saved => {
        if (saved) {
          this.triggerRefresh.emit();
        }
      });
  }
}
