import { IsString, IsOptional, IsNumber, IsEnum, IsDateString } from "class-validator";

export class CreatePaymentDto {
  @IsString() customerId: string;
  @IsOptional() @IsString() orderId?: string;
  @IsOptional() @IsString() reconciliationId?: string;
  @IsNumber() amount: number;
  @IsOptional() @IsEnum(["bank_transfer", "cash", "check", "alipay", "wechat", "other"]) paymentMethod?: string;
  @IsOptional() @IsDateString() paymentDate?: string;
  @IsOptional() @IsString() referenceNo?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdatePaymentDto {
  @IsOptional() @IsNumber() amount?: number;
  @IsOptional() @IsEnum(["bank_transfer", "cash", "check", "alipay", "wechat", "other"]) paymentMethod?: string;
  @IsOptional() @IsDateString() paymentDate?: string;
  @IsOptional() @IsString() referenceNo?: string;
  @IsOptional() @IsString() notes?: string;
}
