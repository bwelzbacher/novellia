import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ALLERGY_SEVERITIES } from '../allergy.types';
import type { AllergySeverity } from '../allergy.types';

export class CreateAllergyDto {
  @IsUUID()
  petId!: string;

  @IsString()
  @MinLength(1)
  allergen!: string;

  @IsIn(ALLERGY_SEVERITIES)
  severity!: AllergySeverity;

  @IsOptional()
  @IsString()
  reaction?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
