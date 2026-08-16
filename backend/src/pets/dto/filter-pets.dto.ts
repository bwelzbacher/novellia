import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PET_SPECIES } from '../pet.types';
import type { PetSpecies } from '../pet.types';

export class FilterPetsDto {
  @IsOptional()
  @IsIn(PET_SPECIES)
  species?: PetSpecies;

  // Partial, case-insensitive match against the pet's name.
  @IsOptional()
  @IsString()
  name?: string;

  // 1-indexed page number; results are paginated to PETS_PAGE_SIZE per page.
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;
}
