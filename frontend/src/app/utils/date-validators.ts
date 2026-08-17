import { AbstractControl, ValidationErrors } from '@angular/forms';

export function dateNotInFuture(control: AbstractControl): ValidationErrors | null {
  const controlDate = new Date(control.value).getTime();
  const today = new Date().getTime();
  return control.value && controlDate > today ? { dateInFuture: true } : null;
}

export function dateNotInPast(control: AbstractControl): ValidationErrors | null {
  const controlDate = new Date(control.value).getTime();
  const today = new Date().getTime();
  return control.value && controlDate < today ? { dateInPast: true } : null;
}
