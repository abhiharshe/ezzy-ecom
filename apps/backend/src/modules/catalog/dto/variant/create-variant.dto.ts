import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateVariantDto {
  @IsString()
  @IsNotEmpty({ message: 'SKU is required' })
  sku!: string;

  @IsObject()
  variant_attributes!: Record<string, string | number | boolean>; // e.g. { "Size": "M", "Color": "Red" }

  @IsInt()
  @Min(0)
  price_in_paise!: number;

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
  @IsInt()
  @Min(0)
  initial_stock?: number; // Stock level to initialize for V1 default warehouse

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
