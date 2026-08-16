import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateAllergyDto } from './create-allergy.dto';

export class UpdateAllergyDto extends PartialType(
  OmitType(CreateAllergyDto, ['petId'] as const),
) {}
