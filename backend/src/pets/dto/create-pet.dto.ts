import {
  IsDateString,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { PET_SEX, PET_SPECIES } from '../pet.types';
import type { PetSex, PetSpecies } from '../pet.types';

export class CreatePetDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsIn(PET_SPECIES)
  species!: PetSpecies;

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsIn(PET_SEX)
  sex!: PetSex;

  @IsOptional()
  @IsNumber()
  weightLbs?: number;

  @IsOptional()
  @IsString()
  microchipId?: string;

  @IsString()
  @MinLength(1)
  ownerName!: string;

  @IsOptional()
  @IsEmail()
  ownerEmail?: string;

  @IsOptional()
  @IsString()
  ownerPhone?: string;
}
