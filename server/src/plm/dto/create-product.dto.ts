 import { IsString, IsOptional, IsEnum } from 'class-validator';
 
 export enum ProductStatus {
   DEVELOPMENT = '开发中',
   PILOT = '试产中',
   RELEASED = '已发布',
   OBSOLETE = '已停产',
 }
 
export class CreateProductDto {
  @IsString()
  productCode: string;

  @IsString()
  productName: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  modelNo?: string;

  @IsOptional()
  @IsString()
  specifications?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: string;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  modelNo?: string;

  @IsOptional()
  @IsString()
  specifications?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: string;
}
 
