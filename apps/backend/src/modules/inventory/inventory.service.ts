import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { StockMovementType } from '@ezzy-ecomm/database';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStockDto } from './dto/update-stock.dto';

const DEFAULT_WAREHOUSE_CODE = 'WH-DEFAULT-MAIN';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);
  private defaultWarehouseIdCache?: string;

  constructor(private prisma: PrismaService) {}

  async getDefaultWarehouseId(): Promise<string> {
    if (this.defaultWarehouseIdCache) {
      return this.defaultWarehouseIdCache;
    }

    let warehouse = await this.prisma.warehouse.findUnique({
      where: { code: DEFAULT_WAREHOUSE_CODE },
    });

    if (!warehouse) {
      warehouse = await this.prisma.warehouse.create({
        data: {
          name: 'Primary Fulfillment Warehouse',
          code: DEFAULT_WAREHOUSE_CODE,
          address: {
            street: '100 Logistics Hub',
            city: 'Bengaluru',
            state: 'Karnataka',
            postal_code: '560001',
            country: 'IN',
          },
          contact: {
            manager: 'Operations Desk',
            email: 'ops@ezzyecomm.com',
            phone: '+91 80 1234 5678',
          },
          is_active: true,
        },
      });
      this.logger.log(`Created default warehouse: ${warehouse.code} (${warehouse.id})`);
    }

    this.defaultWarehouseIdCache = warehouse.id;
    return warehouse.id;
  }

  async getStockLevel(variantId: string) {
    const warehouseId = await this.getDefaultWarehouseId();

    const stock = await this.prisma.stockLevel.findUnique({
      where: {
        variant_id_warehouse_id: {
          variant_id: variantId,
          warehouse_id: warehouseId,
        },
      },
    });

    const onHand = stock?.quantity_on_hand ?? 0;
    const reserved = stock?.quantity_reserved ?? 0;

    return {
      variant_id: variantId,
      warehouse_id: warehouseId,
      quantity_on_hand: onHand,
      quantity_reserved: reserved,
      available_stock: Math.max(0, onHand - reserved),
      reorder_threshold: stock?.reorder_threshold ?? 10,
    };
  }

  async setStock(vendorId: string, variantId: string, dto: UpdateStockDto) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant || variant.deleted_at) {
      throw new NotFoundException('Product variant not found');
    }

    if (variant.product.vendor_id !== vendorId) {
      throw new ForbiddenException('Access denied: Variant belongs to another vendor');
    }

    const warehouseId = await this.getDefaultWarehouseId();

    const existingStock = await this.prisma.stockLevel.findUnique({
      where: {
        variant_id_warehouse_id: {
          variant_id: variantId,
          warehouse_id: warehouseId,
        },
      },
    });

    const previousOnHand = existingStock?.quantity_on_hand ?? 0;
    const diff = dto.quantity_on_hand - previousOnHand;

    const [stockLevel] = await this.prisma.$transaction([
      this.prisma.stockLevel.upsert({
        where: {
          variant_id_warehouse_id: {
            variant_id: variantId,
            warehouse_id: warehouseId,
          },
        },
        create: {
          variant_id: variantId,
          warehouse_id: warehouseId,
          quantity_on_hand: dto.quantity_on_hand,
          quantity_reserved: 0,
          reorder_threshold: dto.reorder_threshold ?? 10,
        },
        update: {
          quantity_on_hand: dto.quantity_on_hand,
          reorder_threshold: dto.reorder_threshold,
        },
      }),
      this.prisma.stockMovement.create({
        data: {
          variant_id: variantId,
          warehouse_id: warehouseId,
          type: diff >= 0 ? StockMovementType.INBOUND : StockMovementType.ADJUSTMENT,
          quantity: diff,
          reference_type: 'MANUAL_ADJUSTMENT',
          notes: dto.notes || `Stock adjusted by vendor ${vendorId}`,
        },
      }),
    ]);

    return {
      variant_id: stockLevel.variant_id,
      quantity_on_hand: stockLevel.quantity_on_hand,
      quantity_reserved: stockLevel.quantity_reserved,
      available_stock: stockLevel.quantity_on_hand - stockLevel.quantity_reserved,
    };
  }

  /**
   * Database-level atomic stock reservation inside a transaction.
   * Guarantees race-condition prevention during multi-user simultaneous checkout.
   */
  async reserveStockTx(
    tx: any,
    items: { variant_id: string; sku: string; quantity: number }[],
    orderId?: string
  ) {
    const warehouseId = await this.getDefaultWarehouseId();

    for (const item of items) {
      // Ensure row exists in StockLevel
      await tx.stockLevel.upsert({
        where: {
          variant_id_warehouse_id: {
            variant_id: item.variant_id,
            warehouse_id: warehouseId,
          },
        },
        create: {
          variant_id: item.variant_id,
          warehouse_id: warehouseId,
          quantity_on_hand: 0,
          quantity_reserved: 0,
        },
        update: {},
      });

      // Atomic reservation with guard condition
      const updatedRows = (await tx.$queryRawUnsafe(
        `UPDATE "inventory"."StockLevel"
         SET quantity_reserved = quantity_reserved + $1,
             updated_at = NOW()
         WHERE variant_id = $2::uuid
           AND warehouse_id = $3::uuid
           AND (quantity_on_hand - quantity_reserved) >= $1
         RETURNING id, variant_id, quantity_on_hand, quantity_reserved`,
        item.quantity,
        item.variant_id,
        warehouseId
      )) as any[];

      if (!updatedRows || updatedRows.length === 0) {
        throw new ConflictException(
          `Insufficient stock for SKU "${item.sku}". Available stock is lower than requested quantity (${item.quantity}).`
        );
      }

      await tx.stockMovement.create({
        data: {
          variant_id: item.variant_id,
          warehouse_id: warehouseId,
          type: StockMovementType.RESERVATION_HOLD,
          quantity: -item.quantity,
          reference_type: 'ORDER_CHECKOUT',
          reference_id: orderId || null,
          notes: `Reserved ${item.quantity} units for checkout`,
        },
      });
    }
  }

  async releaseStockTx(
    tx: any,
    items: { variant_id: string; quantity: number }[],
    orderId?: string
  ) {
    const warehouseId = await this.getDefaultWarehouseId();

    for (const item of items) {
      await tx.$queryRawUnsafe(
        `UPDATE "inventory"."StockLevel"
         SET quantity_reserved = GREATEST(0, quantity_reserved - $1),
             updated_at = NOW()
         WHERE variant_id = $2::uuid
           AND warehouse_id = $3::uuid`,
        item.quantity,
        item.variant_id,
        warehouseId
      );

      await tx.stockMovement.create({
        data: {
          variant_id: item.variant_id,
          warehouse_id: warehouseId,
          type: StockMovementType.RESERVATION_RELEASE,
          quantity: item.quantity,
          reference_type: 'ORDER_CANCELLED',
          reference_id: orderId || null,
          notes: `Released ${item.quantity} reserved units`,
        },
      });
    }
  }

  async commitStockTx(
    tx: any,
    items: { variant_id: string; quantity: number }[],
    orderId?: string
  ) {
    const warehouseId = await this.getDefaultWarehouseId();

    for (const item of items) {
      await tx.$queryRawUnsafe(
        `UPDATE "inventory"."StockLevel"
         SET quantity_on_hand = GREATEST(0, quantity_on_hand - $1),
             quantity_reserved = GREATEST(0, quantity_reserved - $1),
             updated_at = NOW()
         WHERE variant_id = $2::uuid
           AND warehouse_id = $3::uuid`,
        item.quantity,
        item.variant_id,
        warehouseId
      );

      await tx.stockMovement.create({
        data: {
          variant_id: item.variant_id,
          warehouse_id: warehouseId,
          type: StockMovementType.OUTBOUND,
          quantity: -item.quantity,
          reference_type: 'ORDER_FULFILLED',
          reference_id: orderId || null,
          notes: `Fulfilled and shipped ${item.quantity} units`,
        },
      });
    }
  }
}
