import { IsString, IsOptional, IsInt, IsIn } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  orgCode: string;

  @IsString()
  orgName: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsString()
  @IsIn(['启用', '停用'])
  status?: string;
}

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  orgCode?: string;

  @IsOptional()
  @IsString()
  orgName?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsString()
  @IsIn(['启用', '停用'])
  status?: string;
}
