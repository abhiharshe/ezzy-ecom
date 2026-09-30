import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class UpdateStockDto {
  @IsInt()
  @Min(0, { message: 'Stock quantity cannot be negative' })
  quantity_on_hand!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  reorder_threshold?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
