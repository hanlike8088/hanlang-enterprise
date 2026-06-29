 import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
 
 export enum MaterialCategory {
   RAW = '原材料',
   SEMI = '半成品',
   FINISHED = '成品',
   OUTSOURCED = '外协件',
 }
 
 export class CreateMaterialDto {
   @IsString()
   materialName: string;
 
   @IsEnum(MaterialCategory)
   category: string;
 
   @IsString()
   unit: string;
 
   @IsOptional()
   @IsString()
   spec?: string;
 
   @IsOptional()
   @IsNumber()
   safetyStock?: number;
 
   @IsOptional()
   @IsNumber()
   stock?: number;
 
   @IsOptional()
   @IsNumber()
   price?: number;
 }
 
 export class UpdateMaterialDto {
   @IsOptional()
   @IsString()
   materialName?: string;
 
   @IsOptional()
   @IsEnum(MaterialCategory)
   category?: string;
 
   @IsOptional()
   @IsString()
   spec?: string;
 
   @IsOptional()
   @IsString()
   unit?: string;
 
   @IsOptional()
   @IsNumber()
   safetyStock?: number;
 
   @IsOptional()
   @IsNumber()
   stock?: number;
 
   @IsOptional()
   @IsNumber()
   price?: number;
 }
 
