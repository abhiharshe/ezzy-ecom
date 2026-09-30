import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { OrderStatus, OrderItemStatus } from '@ezzy-ecomm/database';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { CommissionService } from '../affiliates/services/commission.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateSubOrderStatusDto } from './dto/update-suborder-status.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';

function serializeOrder<T extends Record<string, any>>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) =>
      typeof value === 'bigint' ? Number(value) : value
    )
  );
}

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
    private commissionService: CommissionService
  ) {}

  async checkout(userId: string, dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const variantIds = dto.items.map((i) => i.variant_id);
    const variants = await this.prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
        is_active: true,
        deleted_at: null,
      },
      include: {
        product: {
          include: {
            category: true,
            vendor: true,
          },
        },
      },
    });

    if (variants.length !== variantIds.length) {
      throw new NotFoundException('One or more selected products are unavailable');
    }

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    // Group items by vendor
    const vendorGroups = new Map<
      string,
      {
        vendor: any;
        items: {
          variant: any;
          quantity: number;
          unit_price_in_paise: bigint;
          total_price_in_paise: bigint;
        }[];
        subtotal_in_paise: bigint;
      }
    >();

    let orderSubtotal = BigInt(0);

    for (const item of dto.items) {
      const variant = variantMap.get(item.variant_id)!;
      const vendor = variant.product.vendor;
      const vendorId = vendor.id;

      const unitPrice = variant.price_in_paise;
      const totalPrice = unitPrice * BigInt(item.quantity);
      orderSubtotal += totalPrice;

      if (!vendorGroups.has(vendorId)) {
        vendorGroups.set(vendorId, {
          vendor,
          items: [],
          subtotal_in_paise: BigInt(0),
        });
      }

      const group = vendorGroups.get(vendorId)!;
      group.items.push({
        variant,
        quantity: item.quantity,
        unit_price_in_paise: unitPrice,
        total_price_in_paise: totalPrice,
      });
      group.subtotal_in_paise += totalPrice;
    }

    const taxInPaise = BigInt(0); // GST calculation (can be derived per item)
    const shippingInPaise = BigInt(0); // Shipping calculation
    const discountInPaise = BigInt(0);
    const totalAmountInPaise = orderSubtotal + taxInPaise + shippingInPaise - discountInPaise;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `EZZ-${dateStr}-${randSuffix}`;

    const reservationPayload = dto.items.map((i) => ({
      variant_id: i.variant_id,
      sku: variantMap.get(i.variant_id)!.sku,
      quantity: i.quantity,
    }));

    // Transactional checkout with atomic stock reservation
    const orderResult = await this.prisma.$transaction(async (tx) => {
      // 1. Atomic inventory hold
      await this.inventoryService.reserveStockTx(tx, reservationPayload);

      // 2. Create Parent Order
      const order = await tx.order.create({
        data: {
          order_number: orderNumber,
          customer_id: userId,
          status: OrderStatus.CONFIRMED,
          subtotal_in_paise: orderSubtotal,
          tax_in_paise: taxInPaise,
          shipping_in_paise: shippingInPaise,
          discount_in_paise: discountInPaise,
          total_amount_in_paise: totalAmountInPaise,
          shipping_address: dto.shipping_address as any,
          billing_address: (dto.billing_address || dto.shipping_address) as any,
          customer_notes: dto.customer_notes,
          coupon_code: dto.coupon_code,
          affiliate_code: dto.affiliate_code,
        },
      });

      // 3. Create SubOrders grouped by vendor
      let vendorIndex = 1;
      for (const [vendorId, group] of vendorGroups.entries()) {
        const subOrderNumber = `${orderNumber}-V${vendorIndex++}`;
        const subtotal = group.subtotal_in_paise;
        const total = subtotal; // can include split tax/shipping

        const subOrder = await tx.subOrder.create({
          data: {
            sub_order_number: subOrderNumber,
            order_id: order.id,
            vendor_id: vendorId,
            status: OrderStatus.CONFIRMED,
            subtotal_in_paise: subtotal,
            total_amount_in_paise: total,
          },
        });

        // 4. Create OrderItems
        for (const item of group.items) {
          await tx.orderItem.create({
            data: {
              order_id: order.id,
              sub_order_id: subOrder.id,
              variant_id: item.variant.id,
              vendor_id: vendorId,
              quantity: item.quantity,
              unit_price_in_paise: item.unit_price_in_paise,
              total_price_in_paise: item.total_price_in_paise,
              status: OrderItemStatus.PENDING,
            },
          });
        }
      }

      // 5. Initial status history
      await tx.orderStatusHistory.create({
        data: {
          order_id: order.id,
          to_status: OrderStatus.CONFIRMED,
          notes: 'Order placed and confirmed successfully with multi-vendor split.',
          changed_by: userId,
        },
      });

      return tx.order.findUnique({
        where: { id: order.id },
        include: {
          sub_orders: {
            include: {
              vendor: {
                select: { id: true, business_name: true, slug: true },
              },
              items: {
                include: {
                  variant: {
                    select: { id: true, sku: true, variant_attributes: true },
                  },
                },
              },
            },
          },
          status_history: true,
        },
      });
    });

    if (dto.affiliate_code && orderResult) {
      try {
        await this.commissionService.calculateAndCreateCommissions(
          orderResult.id,
          dto.affiliate_code,
          orderSubtotal
        );
      } catch (err: unknown) {
        // Non-blocking for checkout flow
      }
    }

    return serializeOrder(orderResult!);
  }

  async findCustomerOrders(userId: string, query: QueryOrdersDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      customer_id: userId,
      deleted_at: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: {
          sub_orders: {
            include: {
              vendor: { select: { id: true, business_name: true } },
              items: {
                include: {
                  variant: {
                    select: {
                      id: true,
                      sku: true,
                      variant_attributes: true,
                      product: { select: { name: true, slug: true } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items: serializeOrder(orders),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findCustomerOrderById(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        sub_orders: {
          include: {
            vendor: { select: { id: true, business_name: true, support_email: true } },
            items: {
              include: {
                variant: {
                  select: {
                    id: true,
                    sku: true,
                    variant_attributes: true,
                    product: { select: { id: true, name: true, slug: true } },
                  },
                },
              },
            },
          },
        },
        status_history: { orderBy: { created_at: 'asc' } },
      },
    });

    if (!order || order.deleted_at) {
      throw new NotFoundException('Order not found');
    }

    if (order.customer_id !== userId) {
      throw new ForbiddenException('Access denied to this order');
    }

    return serializeOrder(order);
  }

  async findVendorSubOrders(vendorId: string, query: QueryOrdersDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      vendor_id: vendorId,
      deleted_at: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    const [total, subOrders] = await Promise.all([
      this.prisma.subOrder.count({ where }),
      this.prisma.subOrder.findMany({
        where,
        include: {
          order: {
            select: {
              order_number: true,
              shipping_address: true,
              created_at: true,
            },
          },
          items: {
            include: {
              variant: {
                select: {
                  id: true,
                  sku: true,
                  variant_attributes: true,
                  product: { select: { name: true, slug: true } },
                },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items: serializeOrder(subOrders),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findVendorSubOrderById(vendorId: string, subOrderId: string) {
    const subOrder = await this.prisma.subOrder.findUnique({
      where: { id: subOrderId },
      include: {
        order: {
          select: {
            id: true,
            order_number: true,
            shipping_address: true,
            billing_address: true,
            created_at: true,
          },
        },
        items: {
          include: {
            variant: {
              select: {
                id: true,
                sku: true,
                variant_attributes: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    category: { select: { return_window_days: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!subOrder || subOrder.deleted_at) {
      throw new NotFoundException('Sub-order not found');
    }

    if (subOrder.vendor_id !== vendorId) {
      throw new ForbiddenException('Access denied: Sub-order belongs to another vendor');
    }

    return serializeOrder(subOrder);
  }

  async updateSubOrderStatus(
    vendorId: string,
    subOrderId: string,
    dto: UpdateSubOrderStatusDto
  ) {
    const subOrder = await this.findVendorSubOrderById(vendorId, subOrderId);

    let deliveredAt: Date | undefined = undefined;
    let escrowReleaseDate: Date | undefined = undefined;

    if (dto.status === OrderStatus.DELIVERED && !subOrder.delivered_at) {
      deliveredAt = new Date();

      // Find max return window from category specs
      const returnWindows = subOrder.items.map(
        (i: any) => i.variant.product.category?.return_window_days ?? 7
      );
      const maxWindowDays = Math.max(7, ...returnWindows);

      escrowReleaseDate = new Date(
        deliveredAt.getTime() + maxWindowDays * 24 * 60 * 60 * 1000
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // If delivered, commit stock (deduct on_hand & reserved)
      if (dto.status === OrderStatus.DELIVERED) {
        const commitItems = subOrder.items.map((i: any) => ({
          variant_id: i.variant_id,
          quantity: i.quantity,
        }));
        await this.inventoryService.commitStockTx(tx, commitItems, subOrder.order_id);
      }

      return tx.subOrder.update({
        where: { id: subOrderId },
        data: {
          status: dto.status,
          shipping_carrier: dto.shipping_carrier,
          tracking_number: dto.tracking_number,
          delivered_at: deliveredAt,
          escrow_release_date: escrowReleaseDate,
        },
        include: {
          items: true,
        },
      });
    });

    return serializeOrder(updated);
  }
}
