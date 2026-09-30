import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentIntentDto } from '../dto/create-payment-intent.dto';
import { VerifyPaymentDto } from '../dto/verify-payment.dto';
import {
  PaymentProvider,
  PaymentStatus,
  OrderStatus,
  WebhookEventStatus,
} from '@ezzy-ecomm/database';
import {
  PaymentCapturedEvent,
  PaymentFailedEvent,
} from '../../../common/events/payment-events';

function serializeData<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) =>
      typeof value === 'bigint' ? Number(value) : value
    )
  );
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * Initiates payment order intent with payment provider (Razorpay/Cashfree/Mock)
   */
  async createPaymentIntent(userId: string, dto: CreatePaymentIntentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.order_id },
      include: {
        payments: { where: { status: PaymentStatus.CAPTURED } },
      },
    });

    if (!order || order.deleted_at) {
      throw new NotFoundException('Order not found');
    }

    if (order.customer_id !== userId) {
      throw new ForbiddenException('Access denied to this order');
    }

    if (order.payments.length > 0) {
      throw new ConflictException('Order has already been paid and captured');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot pay for a cancelled order');
    }

    const provider = dto.provider || PaymentProvider.RAZORPAY;
    const randSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const transactionRef = `pay_${provider.toLowerCase()}_${order.order_number}_${randSuffix}`;

    // Create payment record in PENDING state
    const payment = await this.prisma.payment.create({
      data: {
        order_id: order.id,
        provider,
        transaction_reference: transactionRef,
        amount_in_paise: order.total_amount_in_paise,
        currency: order.currency,
        status: PaymentStatus.PENDING,
      },
    });

    const keyId =
      this.configService.get<string>('RAZORPAY_KEY_ID') || 'rzp_test_mock_key';

    return serializeData({
      payment_id: payment.id,
      order_id: order.id,
      order_number: order.order_number,
      amount_in_paise: payment.amount_in_paise,
      currency: payment.currency,
      provider: payment.provider,
      transaction_reference: payment.transaction_reference,
      gateway_key: keyId,
    });
  }

  /**
   * Verifies client-side payment callback signature and captures the payment
   */
  async verifyPayment(userId: string, dto: VerifyPaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.order_id },
      include: { payments: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customer_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.payment_id },
    });

    if (!payment || payment.order_id !== dto.order_id) {
      throw new NotFoundException('Payment record not found for this order');
    }

    if (payment.status === PaymentStatus.CAPTURED) {
      return serializeData(payment);
    }

    // Signature verification (HMAC-SHA256) if gateway secret is provided
    const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    if (secret && dto.signature) {
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${dto.transaction_reference}|${dto.payment_id}`)
        .digest('hex');

      if (generatedSignature !== dto.signature) {
        throw new BadRequestException('Invalid payment signature verification failed');
      }
    }

    // Execute atomic payment capture & order status transition
    const captured = await this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.CAPTURED,
          payment_method: dto.payment_method || 'UPI',
          gateway_response: {
            verified_at: new Date().toISOString(),
            transaction_reference: dto.transaction_reference,
          },
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PROCESSING },
      });

      await tx.subOrder.updateMany({
        where: { order_id: order.id },
        data: { status: OrderStatus.PROCESSING },
      });

      await tx.orderStatusHistory.create({
        data: {
          order_id: order.id,
          from_status: order.status,
          to_status: OrderStatus.PROCESSING,
          notes: `Payment captured via ${payment.provider} (Ref: ${dto.transaction_reference})`,
          changed_by: userId,
        },
      });

      return updatedPayment;
    });

    // Emit PaymentCapturedEvent in background
    this.eventEmitter.emit(
      'payment.captured',
      new PaymentCapturedEvent(
        captured.id,
        order.id,
        captured.provider,
        captured.amount_in_paise,
        dto.transaction_reference
      )
    );

    this.logger.log(`Payment ${captured.id} captured successfully for order ${order.id}`);
    return serializeData(captured);
  }

  /**
   * Handles incoming server-to-server gateway webhooks (e.g. Razorpay, Cashfree)
   */
  async handleGatewayWebhook(
    provider: string,
    rawBody: string,
    signature: string | undefined,
    payload: Record<string, any>
  ) {
    // 1. Audit Log Webhook Event
    const webhookLog = await this.prisma.webhookEventLog.create({
      data: {
        source: provider.toUpperCase(),
        event_type: payload?.event || 'payment.event',
        payload: payload || {},
        status: WebhookEventStatus.PROCESSING,
      },
    });

    const secret =
      this.configService.get<string>(`${provider.toUpperCase()}_WEBHOOK_SECRET`) ||
      this.configService.get<string>('RAZORPAY_KEY_SECRET');

    if (secret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        await this.prisma.webhookEventLog.update({
          where: { id: webhookLog.id },
          data: {
            status: WebhookEventStatus.FAILED,
            error_message: 'Invalid webhook HMAC signature',
          },
        });
        throw new ForbiddenException('Invalid webhook signature');
      }
    }

    try {
      const eventType = payload?.event;
      if (eventType === 'payment.captured' || eventType === 'order.paid') {
        const paymentEntity = payload.payload?.payment?.entity;
        const transactionRef = paymentEntity?.order_id || payload.order_id;

        if (transactionRef) {
          const payment = await this.prisma.payment.findFirst({
            where: { transaction_reference: transactionRef },
            include: { order: true },
          });

          if (payment && payment.status !== PaymentStatus.CAPTURED) {
            await this.prisma.$transaction([
              this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                  status: PaymentStatus.CAPTURED,
                  gateway_response: payload,
                },
              }),
              this.prisma.order.update({
                where: { id: payment.order_id },
                data: { status: OrderStatus.PROCESSING },
              }),
              this.prisma.subOrder.updateMany({
                where: { order_id: payment.order_id },
                data: { status: OrderStatus.PROCESSING },
              }),
            ]);

            this.eventEmitter.emit(
              'payment.captured',
              new PaymentCapturedEvent(
                payment.id,
                payment.order_id,
                payment.provider,
                payment.amount_in_paise,
                transactionRef
              )
            );
          }
        }
      }

      await this.prisma.webhookEventLog.update({
        where: { id: webhookLog.id },
        data: {
          status: WebhookEventStatus.PROCESSED,
          processed_at: new Date(),
        },
      });

      return { success: true, message: 'Webhook processed' };
    } catch (err: unknown) {
      await this.prisma.webhookEventLog.update({
        where: { id: webhookLog.id },
        data: {
          status: WebhookEventStatus.FAILED,
          error_message: (err as Error).message,
        },
      });
      throw err;
    }
  }

  /**
   * Get payments for an order
   */
  async getOrderPayments(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: { orderBy: { created_at: 'desc' } } },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customer_id !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return serializeData(order.payments);
  }
}
