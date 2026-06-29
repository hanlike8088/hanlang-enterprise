import { IsString, IsOptional, IsBoolean, IsArray, IsIn } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  employeeCode: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  orgId: string;

  @IsOptional()
  @IsString()
  hireDate?: string;

  @IsOptional()
  @IsString()
  @IsIn(['在职', '离职', '停薪留职'])
  status?: string;

  @IsOptional()
  @IsArray()
  positionIds?: string[];
}

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  employeeCode?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  orgId?: string;

  @IsOptional()
  @IsString()
  hireDate?: string;

  @IsOptional()
  @IsString()
  @IsIn(['在职', '离职', '停薪留职'])
  status?: string;

  @IsOptional()
  @IsArray()
  positionIds?: string[];
}
