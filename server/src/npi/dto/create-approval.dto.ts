import { IsString, IsOptional } from 'class-validator';

export class CreateApprovalDto {
  @IsString()
  projectId: string;

  @IsString()
  approvalType: string;

  @IsString()
  applicant: string;
}

export class ReviewApprovalDto {
  @IsString()
  status: string; // 已通过 | 已驳回

  @IsOptional()
  @IsString()
  comment?: string;

  @IsString()
  approver: string;
}
