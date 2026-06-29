import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum ProjectStatus {
  立项 = '立项',
  样机 = '样机',
  试产 = '试产',
  验证 = '验证',
  量产 = '量产',
}

export enum ProjectPriority {
  高 = '高',
  中 = '中',
  低 = '低',
}

export class CreateProjectDto {
  @IsString()
  projectCode: string;

  @IsString()
  projectName: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: string;

  @IsOptional()
  @IsEnum(ProjectPriority)
  priority?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  targetDate: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  projectName?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: string;

  @IsOptional()
  @IsEnum(ProjectPriority)
  priority?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @IsOptional()
  @IsDateString()
  actualEndDate?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
