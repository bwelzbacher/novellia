import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButton } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { finalize } from 'rxjs';
import { ALLERGY_SEVERITIES, AllergySeverity } from '../../../models/allergy.model';
import { FormatConstPipe } from '../../../pipes/format-const.pipe';
import { AllergiesService } from '../../../services/allergies.service';

export interface AllergyFormSheetData {
  petId: string;
}

@Component({
  selector: 'app-allergy-form-sheet',
  imports: [ReactiveFormsModule, MatFormField, MatLabel, MatError, MatInput, MatSelect, MatOption, MatButton, FormatConstPipe],
  templateUrl: './allergy-form-sheet.html',
  styleUrl: './allergy-form-sheet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllergyFormSheet {
  private readonly data = inject<AllergyFormSheetData>(MAT_BOTTOM_SHEET_DATA);
  private readonly sheetRef = inject(MatBottomSheetRef<AllergyFormSheet, boolean>);
  private readonly allergiesService = inject(AllergiesService);
  private readonly fb = inject(FormBuilder);

  protected readonly saving = signal(false);
  protected readonly severities = ALLERGY_SEVERITIES;

  protected readonly form = this.fb.nonNullable.group({
    allergen: ['', Validators.required],
    severity: ['MODERATE' as AllergySeverity, Validators.required],
    reaction: [''],
    notes: [''],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);

    this.allergiesService
      .createAllergy({
        petId: this.data.petId,
        allergen: value.allergen.trim(),
        severity: value.severity,
        reaction: value.reaction.trim() || undefined,
        notes: value.notes.trim() || undefined,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(() => this.sheetRef.dismiss(true));
  }

  cancel(): void {
    this.sheetRef.dismiss();
  }
}
