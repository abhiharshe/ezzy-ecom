import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class StockItemReservationDto {
  @IsUUID('4')
  @IsNotEmpty()
  variant_id!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}
