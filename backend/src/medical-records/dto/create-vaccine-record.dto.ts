import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateVaccineRecordDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsDateString()
  administeredDate!: string;

  @IsOptional()
  @IsDateString()
  nextDueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
