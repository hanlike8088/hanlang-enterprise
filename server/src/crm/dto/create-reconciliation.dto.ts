import { IsString, IsOptional, IsNumber, IsEnum, IsDateString } from "class-validator";

export class CreateReconciliationDto {
  @IsString() customerId: string;
  @IsOptional() @IsString() orderId?: string;
  @IsNumber() totalAmount: number;
  @IsOptional() @IsNumber() paidAmount?: number;
  @IsOptional() @IsDateString() paymentDueDate?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateReconciliationDto {
  @IsOptional() @IsNumber() totalAmount?: number;
  @IsOptional() @IsNumber() paidAmount?: number;
  @IsOptional() @IsDateString() paymentDueDate?: string;
  @IsOptional() @IsEnum(["pending", "partial", "paid", "overdue"]) status?: string;
  @IsOptional() @IsString() notes?: string;
}
