import { DatePipe, KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from "@angular/material/card";
import { MatIcon } from "@angular/material/icon";
import { RouterLink } from '@angular/router';
import { MedicalRecord, VaccineRecord } from '../../../../models/medical-record.model';
import { PetId } from '../../../../models/pet.model';

export type VaccineRecordWithOffice = VaccineRecord & {
  officeName: string;
};

@Component({
  selector: 'app-immunization',
  imports: [MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent, MatCardActions, MatIcon, DatePipe, RouterLink, MatButton, KeyValuePipe],
  templateUrl: './immunization.html',
  styleUrl: './immunization.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImmunizationComponent {
  readonly records = input.required<MedicalRecord[]>();
  readonly petId = input.required<PetId>();

  protected readonly groupedVaccines = computed(() => {
    const vaccines = this.records().flatMap(record =>
      record.vaccineRecords.map(vaccine => ({ ...vaccine, officeName: record.vetRecord?.officeName ?? '' }))
    );
    return vaccines
      .sort(
        (a, b) =>
          new Date(b.administeredDate).getTime() - new Date(a.administeredDate).getTime()
      )
      .reduce((acc, vaccine) => {
        (acc[vaccine.name] ??= []).push(vaccine);
        return acc;
      }, {} as Record<string, VaccineRecordWithOffice[]>);
  });
}
