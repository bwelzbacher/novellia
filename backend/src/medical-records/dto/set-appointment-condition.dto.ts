import { IsUUID } from 'class-validator';

export class SetAppointmentConditionDto {
  @IsUUID()
  conditionId!: string;
}
