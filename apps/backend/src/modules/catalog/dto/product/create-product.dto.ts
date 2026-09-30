import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '@ezzy-ecomm/database';
import { CreateVariantDto } from '../variant/create-variant.dto';

export class CreateProductImageDto {
  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsOptional()
  @IsString()
  alt_text?: string;

  @IsOptional()
  @IsInt()
  sort_order?: number;

  @IsOptional()
  @IsBoolean()
  is_primary?: boolean;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Product name is required' })
  name!: string;

  @IsUUID('4', { message: 'Valid category ID is required' })
  category_id!: string;

  @IsOptional()
  @IsUUID('4')
  brand_id?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, string | number | boolean>; // Marketing specs identical across variants (e.g. { "Brand": "Nike", "Material": "Cotton" })

  @IsInt()
  @Min(0)
  base_price_in_paise!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  compare_at_price_in_paise?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  cost_price_in_paise?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  is_featured?: boolean;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  images?: CreateProductImageDto[];
}
