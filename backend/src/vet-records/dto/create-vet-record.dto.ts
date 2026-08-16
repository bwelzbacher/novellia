import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateVetRecordDto {
  @IsString()
  @MinLength(1)
  officeName!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  hours?: string;
}
