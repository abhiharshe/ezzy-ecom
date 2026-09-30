import {
  Controller,
  Post,
  Param,
  Body,
  Headers,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { PaymentsService } from '../services/payments.service';
import { Public } from '../../../common/decorators/public.decorator';

@Controller('webhooks/payments')
export class WebhooksController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post(':provider')
  async handlePaymentWebhook(
    @Param('provider') provider: string,
    @Headers('x-razorpay-signature') rzpSignature?: string,
    @Headers('x-webhook-signature') cashfreeSignature?: string,
    @Body() payload: any = {},
    @Req() req?: Request
  ) {
    const signature = rzpSignature || cashfreeSignature;
    const rawBody = JSON.stringify(payload);
    return this.paymentsService.handleGatewayWebhook(
      provider,
      rawBody,
      signature,
      payload
    );
  }
}
