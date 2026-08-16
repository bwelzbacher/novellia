import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { ALLERGY_SEVERITIES } from '../allergy.types';
import type { AllergySeverity } from '../allergy.types';

export class FilterAllergiesDto {
  @IsOptional()
  @IsUUID()
  petId?: string;

  @IsOptional()
  @IsIn(ALLERGY_SEVERITIES)
  severity?: AllergySeverity;

  // Partial, case-insensitive match against the allergen name.
  @IsOptional()
  @IsString()
  search?: string;
}
