import { IsUUID } from 'class-validator';

export class ExtractRecordQueryDto {
  @IsUUID()
  petId!: string;
}
