import { AbstractControl, ValidationErrors } from '@angular/forms';
import { format } from 'date-fns';

function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function dateNotInFuture(control: AbstractControl): ValidationErrors | null {
  return control.value && control.value > todayIso() ? { dateInFuture: true } : null;
}

export function dateNotInPast(control: AbstractControl): ValidationErrors | null {
  return control.value && control.value < todayIso() ? { dateInPast: true } : null;
}
