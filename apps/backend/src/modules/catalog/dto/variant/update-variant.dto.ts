import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateVariantDto {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsObject()
  variant_attributes?: Record<string, string | number | boolean>;

  @IsOptional()
  @IsInt()
  @Min(0)
  price_in_paise?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  compare_at_price_in_paise?: number;

  @IsOptional()
  @IsInt()
  weight_in_grams?: number;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
