import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { PaymentProvider } from '@ezzy-ecomm/database';

export class CreatePaymentIntentDto {
  @IsNotEmpty()
  @IsUUID()
  order_id!: string;

  @IsOptional()
  @IsEnum(PaymentProvider)
  provider?: PaymentProvider = PaymentProvider.RAZORPAY;
}
