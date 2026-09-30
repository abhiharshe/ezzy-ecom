import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AttributeSchemaItemDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  type!: 'text' | 'select' | 'multi-select' | 'boolean' | 'number';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsBoolean()
  isVariant!: boolean; // Whether this attribute differentiates purchasable SKUs (e.g. Size, Color)

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Category name is required' })
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Invalid parent category ID' })
  parent_id?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeSchemaItemDto)
  attribute_schema?: AttributeSchemaItemDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  return_window_days?: number;

  @IsOptional()
  @IsInt()
  sort_order?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
