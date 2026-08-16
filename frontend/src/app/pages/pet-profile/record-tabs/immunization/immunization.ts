import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent, MatCardActions } from "@angular/material/card";
import { MatIcon } from "@angular/material/icon";
import { RouterLink } from '@angular/router';
import { MedicalRecord, VaccineRecord } from '../../../../models/medical-record.model';
import { MatButton } from '@angular/material/button';
import { PetId } from '../../../../models/pet.model';

@Component({
  selector: 'app-immunization',
  imports: [MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent, MatCardActions, MatIcon, DatePipe, RouterLink, MatButton],
  templateUrl: './immunization.html',
  styleUrl: './immunization.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImmunizationComponent {
  readonly records = input.required<MedicalRecord[]>();
  readonly petId = input.required<PetId>();

  protected readonly vaccineGroups = computed(() => {
    const groups = new Map<string, { record: MedicalRecord; vaccine: VaccineRecord }[]>();
    for (const record of this.records()) {
      for (const vaccine of record.vaccineRecords) {
        const doses = groups.get(vaccine.name) ?? [];
        doses.push({ record, vaccine });
        groups.set(vaccine.name, doses);
      }
    }
    return Array.from(groups.entries())
      .map(([name, doses]) => ({
        name,
        doses: doses.sort(
          (a, b) => new Date(b.vaccine.administeredDate).getTime() - new Date(a.vaccine.administeredDate).getTime(),
        ),
      }))
      .sort(
        (a, b) =>
          new Date(b.doses[0].vaccine.administeredDate).getTime() -
          new Date(a.doses[0].vaccine.administeredDate).getTime(),
      );
  });
}
