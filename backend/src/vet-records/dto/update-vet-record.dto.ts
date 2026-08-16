import { PartialType } from '@nestjs/mapped-types';
import { CreateVetRecordDto } from './create-vet-record.dto';

export class UpdateVetRecordDto extends PartialType(CreateVetRecordDto) {}
