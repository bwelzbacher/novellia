import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CreateAppointmentRecordDto } from './create-appointment-record.dto';
import { CreateVaccineRecordDto } from './create-vaccine-record.dto';
import { CreateMedicationRecordDto } from './create-medication-record.dto';

export class CreateMedicalRecordDto {
  @IsUUID()
  petId!: string;

  // Optional — a medication can be logged without a vet visit.
  @IsOptional()
  @IsUUID()
  vetRecordId?: string;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  sourceSystem?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAppointmentRecordDto)
  appointment?: CreateAppointmentRecordDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVaccineRecordDto)
  vaccineRecords?: CreateVaccineRecordDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMedicationRecordDto)
  medicationRecords?: CreateMedicationRecordDto[];
}
