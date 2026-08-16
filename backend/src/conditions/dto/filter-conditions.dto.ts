import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { CONDITION_STATUSES } from '../condition.types';
import type { ConditionStatus } from '../condition.types';

export class FilterConditionsDto {
  @IsOptional()
  @IsUUID()
  petId?: string;

  @IsOptional()
  @IsIn(CONDITION_STATUSES)
  status?: ConditionStatus;

  // Partial, case-insensitive match against the condition name.
  @IsOptional()
  @IsString()
  search?: string;
}
