import { IsString, IsInt, IsOptional, IsIn } from 'class-validator';

export class CreateDrawingDto {
  @IsString() drawingCode: string;
  @IsString() drawingName: string;
  @IsString() @IsOptional() productId?: string;
  @IsString() @IsOptional() category?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() fileName?: string;
  @IsString() @IsOptional() docType?: string;
  @IsString() @IsOptional() filePath?: string;
  @IsInt() @IsOptional() fileSize?: number;
  @IsString() @IsOptional() uploadBy?: string;
}

export class NewDrawingVersionDto {
  @IsString() @IsOptional() fileName?: string;
  @IsString() @IsOptional() docType?: string;
  @IsString() @IsOptional() filePath?: string;
  @IsInt() @IsOptional() fileSize?: number;
  @IsString() @IsOptional() changeNote?: string;
  @IsString() uploadBy: string;
}

export class UpdateDrawingDto {
  @IsString() @IsOptional() drawingCode?: string;
  @IsString() @IsOptional() drawingName?: string;
  @IsString() @IsOptional() productId?: string;
  @IsString() @IsOptional() category?: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() @IsIn(['active', 'archived']) status?: string;
}