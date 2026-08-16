import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreateAppointmentNoteDto } from './create-appointment-note.dto';

export class CreateAppointmentRecordDto {
  @IsString()
  @MinLength(1)
  time!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  vet?: string;

  @IsString()
  @MinLength(1)
  reason!: string;

  @IsOptional()
  @IsNumber()
  weightLbs?: number;

  @IsOptional()
  @IsNumber()
  temperatureF?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAppointmentNoteDto)
  notes?: CreateAppointmentNoteDto[];

  // The condition this appointment relates to, if any.
  @IsOptional()
  @IsUUID()
  conditionId?: string;
}
