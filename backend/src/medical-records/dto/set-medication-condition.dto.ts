import { IsUUID } from 'class-validator';

export class SetMedicationConditionDto {
  @IsUUID()
  conditionId!: string;
}
