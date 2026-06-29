import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  roleCode: string;

  @IsString()
  roleName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(['启用', '停用'])
  status?: string;

  @IsOptional()
  permIds?: string[];
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  roleCode?: string;

  @IsOptional()
  @IsString()
  roleName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(['启用', '停用'])
  status?: string;

  @IsOptional()
  permIds?: string[];
}

export class AssignRolePermissionsDto {
  @IsString()
  roleId: string;

  @IsString({ each: true })
  permIds: string[];
}

export class AssignPositionRoleDto {
  @IsString()
  positionId: string;

  @IsString()
  roleId: string;
}
