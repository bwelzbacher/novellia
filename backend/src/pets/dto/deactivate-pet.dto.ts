import { IsIn, IsOptional } from 'class-validator';
import { PET_INACTIVE_REASON } from '../pet.types';
import type { PetInactiveReason } from '../pet.types';

export class DeactivatePetDto {
  @IsOptional()
  @IsIn(PET_INACTIVE_REASON)
  reason?: PetInactiveReason;
}
