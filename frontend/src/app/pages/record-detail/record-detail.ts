import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Loading } from "../../components/loading/loading";
import { MedicalRecordFormSheet } from '../../components/sheets/medical-record-form-sheet/medical-record-form-sheet';
import { VetOfficeFormSheet } from '../../components/sheets/vet-office-form-sheet/vet-office-form-sheet';
import { MedicalRecord, MedicationRecord, RecordKind, VaccineRecord } from '../../models/medical-record.model';
import { Pet } from '../../models/pet.model';
import { FormatConstPipe } from '../../pipes/format-const.pipe';
import { PetsService } from '../../services/pets.service';
import { confirmDelete } from '../../utils/delete';
import { RecordDetailStore } from './record-detail.store';
import { Crumb, Breadcrumbs } from '../../components/breadcrumbs/breadcrumbs';

@Component({
  selector: 'app-record-detail',
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
    DatePipe,
    RouterLink,
    Loading,
    FormatConstPipe,
    Breadcrumbs
  ],
  providers: [RecordDetailStore],
  templateUrl: './record-detail.html',
  styleUrl: './record-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly petsService = inject(PetsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly store = inject(RecordDetailStore);
  private readonly bottomSheet = inject(MatBottomSheet);

  protected readonly petId = this.route.snapshot.paramMap.get('petId')!;
  private readonly recordId = this.route.snapshot.paramMap.get('recordId')!;

  protected readonly pet = signal<Pet | null>(null);
  protected readonly record = this.store.record;

  protected readonly crumbs = computed(() => {
    const pet = this.pet();
    const record = this.record();

    if (!pet || !record) {
      return []
    }

    return [{ label: 'Dashboard', routerLink: '/dashboard' },
    { label: pet.name, routerLink: ['/pets', pet.id] },
    { label: this.currentLabel(record) }
    ];
  });

  constructor() {
    this.petsService
      .getPet(this.petId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(pet => this.pet.set(pet));

    this.store.load(this.recordId);
  }

  protected onEditVetOffice(): void {
    const record = this.record();
    if (!record) {
      return;
    }
    this.store.openSheet(VetOfficeFormSheet, {
      data: { medicalRecordId: record.id, vetRecordId: record.vetRecordId },
    });
  }

  protected onAddOrEditAppointment(): void {
    this.openEntrySheet('APPOINTMENT');
  }

  protected onAddMedication(): void {
    this.openEntrySheet('MEDICATION');
  }

  protected onAddNote(): void {
    this.openEntrySheet('NOTE');
  }

  protected onAddVaccine(): void {
    this.openEntrySheet('VACCINE');
  }

  protected onDeleteRecord(): void {
    const record = this.record();
    if (!record) {
      return;
    }
    confirmDelete(this.bottomSheet, {
      title: 'Delete this visit?',
      message: 'This also removes any notes, vaccines, and medications logged on this visit.',
    }).subscribe(confirmed => {
      if (confirmed) {
        this.store.deleteRecord(record.id).subscribe(() => this.router.navigate(['/pets', this.petId]));
      }
    });
  }

  protected onDeleteNote(noteId: string): void {
    confirmDelete(this.bottomSheet, { title: 'Delete this note?' }).subscribe(confirmed => {
      if (confirmed) {
        this.store.deleteAppointmentNote(noteId);
      }
    });
  }

  protected onDeleteMedication(medication: MedicationRecord): void {
    confirmDelete(this.bottomSheet, { title: `Delete ${medication.name}?` }).subscribe(confirmed => {
      if (confirmed) {
        this.store.deleteMedication(medication.id);
      }
    });
  }

  protected onDeleteVaccine(vaccine: VaccineRecord): void {
    confirmDelete(this.bottomSheet, { title: `Delete ${vaccine.name}?` }).subscribe(confirmed => {
      if (confirmed) {
        this.store.deleteVaccine(vaccine.id);
      }
    });
  }

  protected currentLabel(record: MedicalRecord) {
    return record.appointment?.reason ?? 'Medical Record';
  }

  private openEntrySheet(kind: RecordKind): void {
    const record = this.record();
    if (!record) {
      return;
    }
    this.store.openSheet(MedicalRecordFormSheet, { data: { petId: this.petId, kind, existingRecord: record } });
  }
}
