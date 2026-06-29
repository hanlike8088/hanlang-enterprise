import { IsString, IsInt, IsOptional, IsDateString } from 'class-validator';

export class CreateTrialRunDto {
  @IsString()
  projectId: string;

  @IsInt()
  batchSize: number;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  result?: string;

  @IsString()
  createdBy: string;
}

export class UpdateTrialRunDto {
  @IsOptional()
  @IsInt()
  batchSize?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  result?: string;
}
