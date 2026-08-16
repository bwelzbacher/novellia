import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { MEDICATION_STATUSES } from '../medication.types';
import type { MedicationStatus } from '../medication.types';

export class CreateMedicationRecordDto {
  // The condition this medication treats, if any (see conditions module).
  @IsOptional()
  @IsUUID()
  conditionId?: string;

  // Defaults to ACTIVE at the database level when omitted.
  @IsOptional()
  @IsIn(MEDICATION_STATUSES)
  status?: MedicationStatus;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  dosage?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  prescriber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
