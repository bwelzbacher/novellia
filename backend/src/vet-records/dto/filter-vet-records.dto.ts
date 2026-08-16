import { IsOptional, IsString } from 'class-validator';

export class FilterVetRecordsDto {
  // Partial, case-insensitive match against the office name.
  @IsOptional()
  @IsString()
  officeName?: string;
}
