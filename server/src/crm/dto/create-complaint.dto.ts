import { IsString, IsOptional, IsEnum, IsDateString } from "class-validator";

export class CreateComplaintDto {
  @IsString() customerId: string;
  @IsOptional() @IsString() orderId?: string;
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(["quality", "delivery", "service", "other"]) complaintType?: string;
  @IsOptional() @IsEnum(["minor", "major", "critical"]) severity?: string;
}

export class UpdateComplaintDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(["quality", "delivery", "service", "other"]) complaintType?: string;
  @IsOptional() @IsEnum(["minor", "major", "critical"]) severity?: string;
  @IsOptional() @IsEnum(["pending", "investigating", "resolved", "closed"]) status?: string;
  @IsOptional() @IsString() resolution?: string;
}
