import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '@ezzy-ecomm/database';

export class UpdateSubOrderStatusDto {
  @IsEnum(OrderStatus, { message: 'Invalid order status' })
  status!: OrderStatus;

  @IsOptional()
  @IsString()
  shipping_carrier?: string;

  @IsOptional()
  @IsString()
  tracking_number?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
