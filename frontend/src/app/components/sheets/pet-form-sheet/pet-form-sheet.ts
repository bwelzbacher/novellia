import { TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButton } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { finalize, Observable, of, switchMap } from 'rxjs';
import { PET_SEX, PET_SPECIES, Pet, PetSex, PetSpecies } from '../../../models/pet.model';
import { API_BASE_URL, PetsService } from '../../../services/pets.service';
import { dateNotInFuture } from '../../../utils/date-validators';
import { Loading } from "../../loading/loading";

export interface PetFormSheetData {
  petId?: string;
}

@Component({
  selector: 'app-pet-form-sheet',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatError,
    MatInput,
    MatSelect,
    MatOption,
    MatButton,
    MatIcon,
    TitleCasePipe,
    Loading
  ],
  templateUrl: './pet-form-sheet.html',
  styleUrl: './pet-form-sheet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PetFormSheet {
  private readonly data = inject<PetFormSheetData>(MAT_BOTTOM_SHEET_DATA);
  private readonly sheetRef = inject(MatBottomSheetRef<PetFormSheet, boolean>);
  private readonly petsService = inject(PetsService);
  private readonly fb = inject(FormBuilder);

  protected readonly petId = this.data?.petId ?? null;
  private selectedPhotoFile: File | null = null;

  protected readonly petSpecies = PET_SPECIES;
  protected readonly petSex = PET_SEX;
  protected readonly loading = signal(!!this.petId);
  protected readonly saving = signal(false);
  protected readonly photoPreviewUrl = signal<string | null>(null);
  protected readonly petName = signal('');

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    species: ['DOG' as PetSpecies, Validators.required],
    breed: [''],
    dateOfBirth: ['', dateNotInFuture],
    sex: ['UNKNOWN' as PetSex, Validators.required],
    weightLbs: this.fb.control<number | null>(null),
    microchipId: [''],
    ownerName: ['', Validators.required],
    ownerEmail: ['', Validators.email],
    ownerPhone: [''],
  });

  constructor() {
    if (this.petId) {
      this.petsService.getPet(this.petId).subscribe(pet => this.populateForm(pet));
    }
  }

  private populateForm(pet: Pet): void {
    this.petName.set(pet.name);
    this.form.patchValue({
      name: pet.name,
      species: pet.species,
      breed: pet.breed ?? '',
      dateOfBirth: pet.dateOfBirth ? pet.dateOfBirth.substring(0, 10) : '',
      sex: pet.sex,
      weightLbs: pet.weightLbs,
      microchipId: pet.microchipId ?? '',
      ownerName: pet.ownerName,
      ownerEmail: pet.ownerEmail ?? '',
      ownerPhone: pet.ownerPhone ?? '',
    });
    this.photoPreviewUrl.set(pet.photoUrl ? `${API_BASE_URL}${pet.photoUrl}` : null);
    this.loading.set(false);
  }

  onPhotoSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    this.selectedPhotoFile = file;
    this.photoPreviewUrl.set(URL.createObjectURL(file));
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);

    const request$: Observable<Pet> = this.petId
      ? this.petsService.updatePet(this.petId, {
        name: value.name,
        species: value.species,
        breed: value.breed.trim() || null,
        dateOfBirth: value.dateOfBirth || null,
        sex: value.sex,
        weightLbs: value.weightLbs,
        microchipId: value.microchipId.trim() || null,
        ownerName: value.ownerName,
        ownerEmail: value.ownerEmail.trim() || null,
        ownerPhone: value.ownerPhone.trim() || null,
      })
      : this.petsService.createPet({
        name: value.name,
        species: value.species,
        breed: value.breed.trim() || undefined,
        dateOfBirth: value.dateOfBirth || undefined,
        sex: value.sex,
        weightLbs: value.weightLbs ?? undefined,
        microchipId: value.microchipId.trim() || undefined,
        ownerName: value.ownerName,
        ownerEmail: value.ownerEmail.trim() || undefined,
        ownerPhone: value.ownerPhone.trim() || undefined,
      });

    request$
      .pipe(
        switchMap(pet =>
          this.selectedPhotoFile
            ? this.petsService.uploadPetPhoto(pet.id, this.selectedPhotoFile)
            : of(pet),
        ),
        finalize(() => this.saving.set(false)),
      )
      .subscribe(() => this.sheetRef.dismiss(true));
  }

  cancel(): void {
    this.sheetRef.dismiss();
  }
}
