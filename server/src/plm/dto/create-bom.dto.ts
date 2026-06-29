 import { IsString, IsNumber, IsOptional } from 'class-validator';
 
 export class CreateBomDto {
   @IsString()
   productId: string;
 
   @IsString()
   materialId: string;
 
   @IsNumber()
   quantity: number;
 
   @IsString()
   unit: string;
 
   @IsOptional()
   @IsString()
   version?: string;
 }
 
 export class UpdateBomDto {
   @IsOptional()
   @IsNumber()
   quantity?: number;
 
   @IsOptional()
   @IsString()
   unit?: string;
 
   @IsOptional()
   @IsString()
   version?: string;
 }
 
