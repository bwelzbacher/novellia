import { IsIn, IsString, MinLength } from 'class-validator';
import { APPOINTMENT_NOTE_TYPES } from '../appointment-note.types';
import type { AppointmentNoteType } from '../appointment-note.types';

export class CreateAppointmentNoteDto {
  @IsIn(APPOINTMENT_NOTE_TYPES)
  type!: AppointmentNoteType;

  @IsString()
  @MinLength(1)
  text!: string;
}
