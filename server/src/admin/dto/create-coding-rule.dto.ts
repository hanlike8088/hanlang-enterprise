import { IsString, IsNumber, IsOptional, IsIn, Min, Max } from 'class-validator';

export class CreateCodingRuleDto {
  @IsString()
  docType: string;

  @IsString()
  prefix: string;

  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(4)
  yearDigits?: number;

  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(8)
  serialDigits?: number;

  @IsOptional()
  @IsString()
  separator?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  currentSerial?: number;

  @IsOptional()
  @IsString()
  @IsIn(['yearly', 'monthly', 'none'])
  resetPeriod?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCodingRuleDto {
  @IsOptional()
  @IsString()
  prefix?: string;

  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(4)
  yearDigits?: number;

  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(8)
  serialDigits?: number;

  @IsOptional()
  @IsString()
  separator?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  currentSerial?: number;

  @IsOptional()
  @IsString()
  @IsIn(['yearly', 'monthly', 'none'])
  resetPeriod?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateWorkflowStateDto {
  @IsString()
  stateCode: string;

  @IsString()
  stateName: string;

  @IsString()
  module: string;

  @IsOptional()
  isStart?: boolean;

  @IsOptional()
  isEnd?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateWorkflowTransitionDto {
  @IsString()
  module: string;

  @IsString()
  fromStateId: string;

  @IsString()
  toStateId: string;

  @IsString()
  transitionName: string;

  @IsOptional()
  @IsString()
  requiredPerm?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class CreateSystemSettingDto {
  @IsString()
  settingKey: string;

  @IsString()
  settingValue: string;

  @IsOptional()
  @IsString()
  description?: string;
}
