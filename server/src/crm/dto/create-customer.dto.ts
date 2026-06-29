import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString } from 'class-validator';

export class CreateCustomerDto {
  @IsOptional()
  @IsString()
  customerCode?: string;

  @IsString()
  customerName: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  creditLimit?: number;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  creditLimit?: number;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateContactRecordDto {
  @IsString()
  customerId: string;

  @IsOptional()
  @IsDateString()
  contactDate?: string;

  @IsOptional()
  @IsString()
  contactType?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsDateString()
  nextFollowUp?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;
}

export class UpdateContactRecordDto {
  @IsOptional()
  @IsString()
  contactType?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsDateString()
  nextFollowUp?: string;

  @IsOptional()
  @IsBoolean()
  followUpDone?: boolean;
}
