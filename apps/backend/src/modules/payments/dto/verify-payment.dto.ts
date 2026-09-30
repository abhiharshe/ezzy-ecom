import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class VerifyPaymentDto {
  @IsNotEmpty()
  @IsUUID()
  order_id!: string;

  @IsNotEmpty()
  @IsString()
  payment_id!: string;

  @IsNotEmpty()
  @IsString()
  transaction_reference!: string;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsString()
  payment_method?: string; // "UPI", "CARD", "NETBANKING"
}
