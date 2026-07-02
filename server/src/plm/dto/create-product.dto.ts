import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
 
 export enum ProductStatus {
   DEVELOPMENT = '开发中',
   PILOT = '试产中',
   RELEASED = '已发布',
   OBSOLETE = '已停产',
 }
 
export class CreateProductDto {
  @ApiProperty({ description: '产品编码' })
  @IsString()
  productCode: string;

  @ApiProperty({ description: '产品名称' })
  @IsString()
  productName: string;

  @ApiPropertyOptional({ description: '产品类别' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '型号' })
  @IsOptional()
  @IsString()
  modelNo?: string;

  @ApiPropertyOptional({ description: '规格参数 JSON' })
  @IsOptional()
  @IsString()
  specifications?: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '归属组织 ID' })
  @IsOptional()
  @IsString()
  orgId?: string;

  @ApiPropertyOptional({ description: '来源物料编码' })
  @IsOptional()
  @IsString()
  sourceMaterialCode?: string;

  @ApiPropertyOptional({ description: '状态', enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: string;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  productName?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  modelNo?: string;

  @IsOptional()
  @IsString()
  specifications?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  orgId?: string;

  @IsOptional()
  @IsString()
  sourceMaterialCode?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: string;
}

