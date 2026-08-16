import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButton } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { finalize } from 'rxjs';
import { Condition, CONDITION_STATUSES, ConditionStatus } from '../../../models/condition.model';
import { FormatConstPipe } from '../../../pipes/format-const.pipe';
import { ConditionsService } from '../../../services/conditions.service';

export interface ConditionFormSheetData {
  condition: Condition;
}

@Component({
  selector: 'app-condition-form-sheet',
  imports: [ReactiveFormsModule, MatFormField, MatLabel, MatError, MatInput, MatSelect, MatOption, MatButton, FormatConstPipe],
  templateUrl: './condition-form-sheet.html',
  styleUrl: './condition-form-sheet.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionFormSheet {
  private readonly data = inject<ConditionFormSheetData>(MAT_BOTTOM_SHEET_DATA);
  private readonly sheetRef = inject(MatBottomSheetRef<ConditionFormSheet, boolean>);
  private readonly conditionsService = inject(ConditionsService);
  private readonly fb = inject(FormBuilder);

  protected readonly saving = signal(false);
  protected readonly statuses = CONDITION_STATUSES;

  protected readonly form = this.fb.nonNullable.group({
    name: [this.data.condition.name, Validators.required],
    status: [this.data.condition.status as ConditionStatus, Validators.required],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);

    this.conditionsService
      .updateCondition(this.data.condition.id, {
        name: value.name.trim(),
        status: value.status,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(() => this.sheetRef.dismiss(true));
  }

  cancel(): void {
    this.sheetRef.dismiss();
  }
}
