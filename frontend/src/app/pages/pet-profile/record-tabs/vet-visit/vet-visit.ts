import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatCard, MatCardHeader, MatCardSubtitle, MatCardTitle, MatCardContent, MatCardActions } from "@angular/material/card";
import { MatIcon } from "@angular/material/icon";
import { RouterLink, ɵEmptyOutletComponent } from '@angular/router';
import { MedicalRecord } from '../../../../models/medical-record.model';
import { Pet, PetId } from '../../../../models/pet.model';
import { MatButton } from '@angular/material/button';
import { hasMissingAppointmentDetails } from '../../../../utils/pet-badges';

@Component({
  selector: 'app-vet-visit',
  imports: [MatCard, MatCardHeader, MatCardSubtitle, MatCardTitle, MatCardContent, MatCardActions, MatIcon, RouterLink, DatePipe, MatButton, ɵEmptyOutletComponent, NgTemplateOutlet],
  templateUrl: './vet-visit.html',
  styleUrl: './vet-visit.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VetVisitComponent {
  readonly petId = input.required<PetId>();
  readonly records = input.required<MedicalRecord[]>();
  protected readonly hasMissingAppointmentDetails = hasMissingAppointmentDetails;

  protected readonly appointmentHistory = computed(() =>
    this.records()
      .filter(record => record.appointment && new Date(record.date) <= new Date())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  );

  protected readonly upcomingAppointments = computed(() =>
    this.records()
      .filter(record => record.appointment && new Date(record.date) > new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  );
}
