import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProductsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string; // Category slug or UUID

  @IsOptional()
  @IsString()
  brand?: string; // Brand slug or UUID

  @IsOptional()
  @IsString()
  vendor_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  min_price?: number; // In paise

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  max_price?: number; // In paise

  @IsOptional()
  @IsString()
  sort?: 'latest' | 'price_asc' | 'price_desc' | 'featured';
}
