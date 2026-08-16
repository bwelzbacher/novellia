import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateMedicalRecordDto } from './create-medical-record.dto';

// A record's petId is fixed at creation time; use a different endpoint
// (delete + recreate) to move a record to another pet. Any nested array
// provided (vaccineRecords, medicationRecords) replaces the full existing
// set for that relation rather than merging into it.
export class UpdateMedicalRecordDto extends PartialType(
  OmitType(CreateMedicalRecordDto, ['petId'] as const),
) {}
