import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class CreatePositionDto {
  @IsString()
  positionCode: string;

  @IsString()
  positionName: string;

  @IsString()
  orgId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(['启用', '停用'])
  status?: string;
}

export class UpdatePositionDto {
  @IsOptional()
  @IsString()
  positionCode?: string;

  @IsOptional()
  @IsString()
  positionName?: string;

  @IsOptional()
  @IsString()
  orgId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(['启用', '停用'])
  status?: string;
}
