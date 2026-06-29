import { IsOptional, IsString, IsNumber, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuoteItemDto {
  @IsString()
  materialCode: string;

  @IsString()
  materialName: string;

  @IsString()
  @IsOptional()
  specification?: string;

  @IsString()
  unit: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  @IsOptional()
  unitPrice?: number;
}

export class CreateQuoteDto {
  @IsString()
  productId: string;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsNumber()
  @IsOptional()
  laborCost?: number;

  @IsNumber()
  @IsOptional()
  manufacturingFee?: number;

  @IsNumber()
  @IsOptional()
  profitRate?: number;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteItemDto)
  items: CreateQuoteItemDto[];
}

export class UpdateQuoteDto {
  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsNumber()
  @IsOptional()
  laborCost?: number;

  @IsNumber()
  @IsOptional()
  manufacturingFee?: number;

  @IsNumber()
  @IsOptional()
  profitRate?: number;

  @IsNumber()
  @IsOptional()
  finalPrice?: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteItemDto)
  @IsOptional()
  items?: CreateQuoteItemDto[];
}