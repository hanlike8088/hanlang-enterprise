 import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';
 
 export class CreateWorkOrderDto {
   @IsString()
   productId: string;
 
   @IsNumber()
   quantity: number;
 
   @IsDateString()
   startDate: string;
 
   @IsOptional()
   @IsDateString()
   endDate?: string;
 
   @IsOptional()
   @IsString()
   priority?: string;
 }
 
 export class UpdateWorkOrderDto {
   @IsOptional()
   @IsNumber()
   quantity?: number;
 
   @IsOptional()
   @IsString()
   status?: string;
 
   @IsOptional()
   @IsString()
   priority?: string;
 
   @IsOptional()
   @IsDateString()
   startDate?: string;
 
   @IsOptional()
   @IsDateString()
   endDate?: string;
 }
 
