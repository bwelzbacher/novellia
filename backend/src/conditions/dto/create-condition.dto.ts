import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { CONDITION_STATUSES } from '../condition.types';
import type { ConditionStatus } from '../condition.types';

export class CreateConditionDto {
  @IsUUID()
  petId!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  diagnosingPhysician?: string;

  @IsIn(CONDITION_STATUSES)
  status!: ConditionStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
