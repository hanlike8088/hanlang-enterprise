import { IsString, IsOptional } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  permCode: string;

  @IsString()
  permName: string;

  @IsString()
  resource: string;

  @IsString()
  action: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdatePermissionDto {
  @IsOptional()
  @IsString()
  permCode?: string;

  @IsOptional()
  @IsString()
  permName?: string;

  @IsOptional()
  @IsString()
  resource?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
