import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  docName: string;

  @IsString()
  docType: string;

  @IsString()
  filePath: string;

  @IsNumber()
  fileSize: number;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  patentType?: string;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @IsOptional()
  @IsString()
  docCode?: string;

  @IsOptional()
  @IsString()
  version?: string;
}

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  docName?: string;

  @IsOptional()
  @IsString()
  docType?: string;

  @IsOptional()
  @IsString()
  patentType?: string;

  @IsOptional()
  @IsDateString()
  expirationDate?: string;

  @IsOptional()
  @IsString()
  filePath?: string;

  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @IsOptional()
  @IsString()
  version?: string;
}