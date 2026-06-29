import { IsString, IsInt, IsOptional, IsDateString } from 'class-validator';

export class CreateSamplingOrderDto {
  @IsString() productName: string;
  @IsString() @IsOptional() productCategory?: string;
  @IsInt() quantity: number;
  @IsString() @IsOptional() unit?: string;
  @IsDateString() deadline: string;
 @IsString() @IsOptional() description?: string;
 @IsString() @IsOptional() attachmentPaths?: string;
 @IsString() @IsOptional() drawingId?: string;
  @IsString() @IsOptional() relatedDrawingId?: string;
 @IsString() applicant: string;
  @IsString() @IsOptional() customerName?: string;
}

export class UpdateSamplingOrderDto {
  @IsString() @IsOptional() productName?: string;
  @IsString() @IsOptional() productCategory?: string;
  @IsInt() @IsOptional() quantity?: number;
  @IsString() @IsOptional() unit?: string;
  @IsDateString() @IsOptional() deadline?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() attachmentPaths?: string;
  @IsString() @IsOptional() status?: string;
  @IsString() @IsOptional() applicant?: string;
  @IsString() @IsOptional() customerName?: string;
  @IsString() @IsOptional() assignee?: string;
  @IsString() @IsOptional() progressNote?: string;
  @IsString() @IsOptional() exceptionReason?: string;
}

export class ApproveOrderDto {
  @IsString() approver: string;
  @IsString() @IsOptional() comment?: string;
}

export class AssignOrderDto {
  @IsString() assignee: string;
  @IsString() @IsOptional() comment?: string;
}
