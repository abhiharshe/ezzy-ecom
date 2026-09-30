import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from '../services/payments.service';
import { CreatePaymentIntentDto } from '../dto/create-payment-intent.dto';
import { VerifyPaymentDto } from '../dto/verify-payment.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  async createPaymentIntent(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePaymentIntentDto
  ) {
    return this.paymentsService.createPaymentIntent(userId, dto);
  }

  @Post('verify')
  async verifyPayment(
    @CurrentUser('id') userId: string,
    @Body() dto: VerifyPaymentDto
  ) {
    return this.paymentsService.verifyPayment(userId, dto);
  }

  @Get('orders/:orderId')
  async getOrderPayments(
    @CurrentUser('id') userId: string,
    @Param('orderId') orderId: string
  ) {
    return this.paymentsService.getOrderPayments(userId, orderId);
  }
}
