import { DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Loading } from "../../components/loading/loading";
import { ConditionFormSheet } from '../../components/sheets/condition-form-sheet/condition-form-sheet';
import { LinkAppointmentSheet } from '../../components/sheets/link-appointment-sheet/link-appointment-sheet';
import { LinkMedicationSheet } from '../../components/sheets/link-medication-sheet/link-medication-sheet';
import { Pet } from '../../models/pet.model';
import { FormatConstPipe } from '../../pipes/format-const.pipe';
import { PetsService } from '../../services/pets.service';
import { confirmDelete } from '../../utils/delete';
import { ConditionDetailStore } from './condition-detail.store';
import { Breadcrumbs, Crumb } from "../../components/breadcrumbs/breadcrumbs";

@Component({
  selector: 'app-condition-detail',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatCardActions,
    MatIcon,
    MatButton,
    MatIconButton,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    TitleCasePipe,
    DatePipe,
    RouterLink,
    Loading,
    FormatConstPipe,
    Breadcrumbs
  ],
  providers: [ConditionDetailStore],
  templateUrl: './condition-detail.html',
  styleUrl: './condition-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly petsService = inject(PetsService);
  private readonly store = inject(ConditionDetailStore);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly petId = this.route.snapshot.paramMap.get('petId')!;
  private readonly conditionId = this.route.snapshot.paramMap.get('conditionId')!;

  protected readonly pet = signal<Pet | null>(null);
  protected readonly condition = this.store.condition;

  constructor() {
    this.petsService
      .getPet(this.petId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(pet => this.pet.set(pet));

    this.store.load(this.conditionId);
  }

  protected readonly crumbs = computed(() => {
    const pet = this.pet();
    const condition = this.condition();
    if (!pet || !condition) { return []; }
    return [
      { label: 'Dashboard', routerLink: '/dashboard' },
      { label: pet.name, routerLink: ['/pets', pet.id] },
      { label: condition.name }
    ];
  });

  protected onEdit(): void {
    const condition = this.condition();
    if (!condition) {
      return;
    }
    this.store.openSheet(ConditionFormSheet, { data: { condition } });
  }

  protected onDelete(): void {
    const condition = this.condition();
    if (!condition) {
      return;
    }
    confirmDelete(this.bottomSheet, { title: `Delete ${condition.name}?` }).subscribe(confirmed => {
      if (confirmed) {
        this.store.deleteCondition(condition.id).subscribe(() => this.router.navigate(['/pets', this.petId]));
      }
    });
  }

  protected onRemoveAppointment(appointmentId: string): void {
    this.store.removeAppointment(appointmentId);
  }

  protected onRemoveMedication(medicationId: string): void {
    this.store.removeMedication(medicationId);
  }

  protected onAddAppointment(): void {
    const condition = this.condition();
    if (!condition) {
      return;
    }
    this.store.openSheet(LinkAppointmentSheet, {
      data: {
        petId: this.petId,
        conditionId: condition.id,
        excludeAppointmentIds: condition.appointments.map(appointment => appointment.id),
      },
    });
  }

  protected onAddMedication(): void {
    const condition = this.condition();
    if (!condition) {
      return;
    }
    this.store.openSheet(LinkMedicationSheet, {
      data: {
        petId: this.petId,
        conditionId: condition.id,
        excludeMedicationIds: condition.medications.map(medication => medication.id),
      },
    });
  }
}
