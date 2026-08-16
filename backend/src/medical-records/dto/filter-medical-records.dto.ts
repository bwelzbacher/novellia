import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class FilterMedicalRecordsDto {
  @IsOptional()
  @IsUUID()
  petId?: string;

  @IsOptional()
  @IsUUID()
  vetRecordId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  // Case-insensitive partial match across attached vaccine/medication
  // names and the appointment reason.
  @IsOptional()
  @IsString()
  search?: string;
}
