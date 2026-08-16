import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from "@angular/material/card";
import { MedicalRecordFormSheet } from '../../../../components/sheets/medical-record-form-sheet/medical-record-form-sheet';
import { MedicalRecord, MedicationRecord } from '../../../../models/medical-record.model';
import { PetId } from '../../../../models/pet.model';
import { FormatConstPipe } from '../../../../pipes/format-const.pipe';
import { confirmDelete } from '../../../../utils/delete';
import { PetProfileStore } from '../../pet-profile.store';

@Component({
  selector: 'app-medication',
  imports: [MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent, MatCardActions, DatePipe, MatButton, FormatConstPipe],
  templateUrl: './medication.html',
  styleUrl: './medication.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicationComponent {
  readonly petId = input.required<PetId>();
  readonly records = input.required<MedicalRecord[]>();

  private readonly store = inject(PetProfileStore);
  private readonly bottomSheet = inject(MatBottomSheet);

  protected readonly medicationEntries = computed(() =>
    this.records()
      .flatMap(record => record.medicationRecords.map(medication => ({ record, medication })))
      .sort((a, b) => new Date(b.record.date).getTime() - new Date(a.record.date).getTime()),
  );

  protected onDeleteMedication(medication: MedicationRecord): void {
    confirmDelete(this.bottomSheet, { title: `Delete ${medication.name}?` }).subscribe(confirmed => {
      if (confirmed) {
        this.store.deleteMedication(medication.id);
      }
    });
  }

  protected onEditMedication(entry: { record: MedicalRecord; medication: MedicationRecord }): void {
    this.store.openSheet(MedicalRecordFormSheet, {
      data: {
        petId: this.petId(),
        kind: 'MEDICATION',
        existingRecord: entry.record,
        existingMedicationId: entry.medication.id,
      },
    });
  }
}

