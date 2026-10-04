import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductStatus } from '@ezzy-ecomm/database';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from '../dto/product/create-product.dto';
import { UpdateProductDto } from '../dto/product/update-product.dto';
import { QueryProductsDto } from '../dto/product/query-products.dto';
import {
  CreateAdminProductDto,
  UpdateAdminProductDto,
} from '../dto/product/create-admin-product.dto';
import { QueryAdminProductsDto } from '../dto/product/query-admin-products.dto';
import { CreateVariantDto } from '../dto/variant/create-variant.dto';
import { UpdateVariantDto } from '../dto/variant/update-variant.dto';
import {
  ProductCreatedEvent,
  ProductUpdatedEvent,
} from '../../../common/events/product-events';

// Helper to convert BigInt properties to numbers for API responses
function serializeProduct<T extends Record<string, any>>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) =>
      typeof value === 'bigint' ? Number(value) : value
    )
  );
}

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2
  ) {}

  async createProduct(vendorId: string, dto: CreateProductDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.category_id },
    });

    if (!category || category.deleted_at) {
      throw new NotFoundException('Category not found');
    }

    const baseSlug =
      dto.slug ||
      dto.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

    const existingSlug = await this.prisma.product.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException(`Product slug "${slug}" already exists`);
    }

    // Check SKU uniqueness if variants provided
    if (dto.variants && dto.variants.length > 0) {
      const skus = dto.variants.map((v) => v.sku);
      const existingSkus = await this.prisma.productVariant.findMany({
        where: { sku: { in: skus } },
      });
      if (existingSkus.length > 0) {
        throw new ConflictException(
          `SKUs already exist: ${existingSkus.map((s) => s.sku).join(', ')}`
        );
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          vendor_id: vendorId,
          category_id: dto.category_id,
          brand_id: dto.brand_id || null,
          name: dto.name,
          slug,
          description: dto.description,
          attributes: (dto.attributes ?? {}) as any,
          status: dto.status ?? ProductStatus.DRAFT,
          base_price_in_paise: BigInt(dto.base_price_in_paise),
          compare_at_price_in_paise: dto.compare_at_price_in_paise
            ? BigInt(dto.compare_at_price_in_paise)
            : null,
          cost_price_in_paise: dto.cost_price_in_paise
            ? BigInt(dto.cost_price_in_paise)
            : null,
          tags: dto.tags ?? [],
          is_featured: dto.is_featured ?? false,
        },
      });

      // Create variants if provided
      if (dto.variants && dto.variants.length > 0) {
        for (const v of dto.variants) {
          await tx.productVariant.create({
            data: {
              product_id: product.id,
              sku: v.sku,
              variant_attributes: (v.variant_attributes ?? {}) as any,
              price_in_paise: BigInt(v.price_in_paise),
              compare_at_price_in_paise: v.compare_at_price_in_paise
                ? BigInt(v.compare_at_price_in_paise)
                : null,
              weight_in_grams: v.weight_in_grams,
              barcode: v.barcode,
              is_active: v.is_active ?? true,
            },
          });
        }
      }

      // Create images if provided
      if (dto.images && dto.images.length > 0) {
        await tx.productImage.createMany({
          data: dto.images.map((img) => ({
            product_id: product.id,
            url: img.url,
            alt_text: img.alt_text,
            sort_order: img.sort_order ?? 0,
            is_primary: img.is_primary ?? false,
          })),
        });
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          variants: true,
          images: { orderBy: { sort_order: 'asc' } },
          category: true,
          brand: true,
        },
      });
    });

    if (result) {
      this.eventEmitter.emit(
        'product.created',
        new ProductCreatedEvent(result.id, result.vendor_id, result.name, result.slug)
      );
    }

    return serializeProduct(result!);
  }

  async findAll(query: QueryProductsDto, filterAttributes?: Record<string, string>) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deleted_at: null,
      status: ProductStatus.ACTIVE,
    };

    const isUUID = (str: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        str
      );

    if (query.category) {
      where.category = isUUID(query.category)
        ? { id: query.category }
        : { slug: query.category };
    }

    if (query.brand) {
      where.brand = isUUID(query.brand)
        ? { id: query.brand }
        : { slug: query.brand };
    }

    if (query.vendor_id) {
      where.vendor_id = query.vendor_id;
    }

    if (query.min_price !== undefined || query.max_price !== undefined) {
      where.base_price_in_paise = {};
      if (query.min_price !== undefined) {
        where.base_price_in_paise.gte = BigInt(query.min_price);
      }
      if (query.max_price !== undefined) {
        where.base_price_in_paise.lte = BigInt(query.max_price);
      }
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { tags: { has: query.search.toLowerCase() } },
      ];
    }

    let orderBy: any = { created_at: 'desc' };
    if (query.sort === 'price_asc') {
      orderBy = { base_price_in_paise: 'asc' };
    } else if (query.sort === 'price_desc') {
      orderBy = { base_price_in_paise: 'desc' };
    } else if (query.sort === 'featured') {
      orderBy = [{ is_featured: 'desc' }, { created_at: 'desc' }];
    }

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: {
          variants: {
            where: { is_active: true, deleted_at: null },
          },
          images: {
            where: { is_primary: true },
            take: 1,
          },
          category: {
            select: { id: true, name: true, slug: true, attribute_schema: true },
          },
          brand: {
            select: { id: true, name: true, slug: true, logo_url: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return {
      items: serializeProduct(products),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        variants: {
          where: { deleted_at: null },
          include: { images: true },
        },
        images: { orderBy: { sort_order: 'asc' } },
        category: {
          include: { parent: true },
        },
        brand: true,
        vendor: {
          select: { id: true, business_name: true, slug: true, logo_url: true },
        },
      },
    });

    if (!product || product.deleted_at) {
      throw new NotFoundException(`Product "${slug}" not found`);
    }

    return serializeProduct(product);
  }

  async findVendorProducts(vendorId: string, query: QueryProductsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      vendor_id: vendorId,
      deleted_at: null,
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { tags: { has: query.search.toLowerCase() } },
      ];
    }

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: {
          variants: { where: { deleted_at: null } },
          images: { orderBy: { sort_order: 'asc' } },
          category: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      items: serializeProduct(products),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findVendorProductById(vendorId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: { where: { deleted_at: null } },
        images: { orderBy: { sort_order: 'asc' } },
        category: true,
        brand: true,
      },
    });

    if (!product || product.deleted_at) {
      throw new NotFoundException('Product not found');
    }

    if (product.vendor_id !== vendorId) {
      throw new ForbiddenException('Access denied: Product belongs to another vendor');
    }

    return serializeProduct(product);
  }

  async updateProduct(vendorId: string, productId: string, dto: UpdateProductDto) {
    const product = await this.findVendorProductById(vendorId, productId);

    if (dto.slug && dto.slug !== product.slug) {
      const existing = await this.prisma.product.findUnique({
        where: { slug: dto.slug },
      });
      if (existing) {
        throw new ConflictException(`Product slug "${dto.slug}" already exists`);
      }
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        name: dto.name,
        slug: dto.slug,
        category_id: dto.category_id,
        brand_id: dto.brand_id === undefined ? undefined : dto.brand_id,
        description: dto.description,
        attributes: dto.attributes !== undefined ? (dto.attributes as any) : undefined,
        status: dto.status,
        base_price_in_paise:
          dto.base_price_in_paise !== undefined
            ? BigInt(dto.base_price_in_paise)
            : undefined,
        compare_at_price_in_paise:
          dto.compare_at_price_in_paise !== undefined
            ? BigInt(dto.compare_at_price_in_paise)
            : undefined,
        cost_price_in_paise:
          dto.cost_price_in_paise !== undefined
            ? BigInt(dto.cost_price_in_paise)
            : undefined,
        tags: dto.tags,
        is_featured: dto.is_featured,
      },
      include: {
        variants: { where: { deleted_at: null } },
        images: { orderBy: { sort_order: 'asc' } },
      },
    });

    this.eventEmitter.emit(
      'product.updated',
      new ProductUpdatedEvent(updated.id, updated.vendor_id, updated.name, updated.slug)
    );

    return serializeProduct(updated);
  }

  async addVariant(vendorId: string, productId: string, dto: CreateVariantDto) {
    await this.findVendorProductById(vendorId, productId);

    const existingSku = await this.prisma.productVariant.findUnique({
      where: { sku: dto.sku },
    });
    if (existingSku) {
      throw new ConflictException(`SKU "${dto.sku}" already exists`);
    }

    const variant = await this.prisma.productVariant.create({
      data: {
        product_id: productId,
        sku: dto.sku,
        variant_attributes: (dto.variant_attributes ?? {}) as any,
        price_in_paise: BigInt(dto.price_in_paise),
        compare_at_price_in_paise: dto.compare_at_price_in_paise
          ? BigInt(dto.compare_at_price_in_paise)
          : null,
        weight_in_grams: dto.weight_in_grams,
        barcode: dto.barcode,
        is_active: dto.is_active ?? true,
      },
    });

    return serializeProduct(variant);
  }

  async updateVariant(
    vendorId: string,
    productId: string,
    variantId: string,
    dto: UpdateVariantDto
  ) {
    await this.findVendorProductById(vendorId, productId);

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant || variant.product_id !== productId || variant.deleted_at) {
      throw new NotFoundException('Product variant not found');
    }

    if (dto.sku && dto.sku !== variant.sku) {
      const existingSku = await this.prisma.productVariant.findUnique({
        where: { sku: dto.sku },
      });
      if (existingSku) {
        throw new ConflictException(`SKU "${dto.sku}" already exists`);
      }
    }

    const updated = await this.prisma.productVariant.update({
      where: { id: variantId },
      data: {
        sku: dto.sku,
        variant_attributes:
          dto.variant_attributes !== undefined
            ? (dto.variant_attributes as any)
            : undefined,
        price_in_paise:
          dto.price_in_paise !== undefined
            ? BigInt(dto.price_in_paise)
            : undefined,
        compare_at_price_in_paise:
          dto.compare_at_price_in_paise !== undefined
            ? BigInt(dto.compare_at_price_in_paise)
            : undefined,
        weight_in_grams: dto.weight_in_grams,
        barcode: dto.barcode,
        is_active: dto.is_active,
      },
    });

    return serializeProduct(updated);
  }

  async deleteProduct(vendorId: string, productId: string) {
    await this.findVendorProductById(vendorId, productId);

    return this.prisma.product.update({
      where: { id: productId },
      data: { deleted_at: new Date(), status: ProductStatus.ARCHIVED },
    });
  }

  // ===========================================================================
  // SUPERADMIN PRODUCT METHODS
  // ===========================================================================

  async findAllAdmin(query: QueryAdminProductsDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deleted_at: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.category_id) {
      where.category_id = query.category_id;
    }

    if (query.vendor_id) {
      where.vendor_id = query.vendor_id;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { tags: { has: query.search.toLowerCase() } },
        { variants: { some: { sku: { contains: query.search, mode: 'insensitive' } } } },
      ];
    }

    let orderBy: any = { created_at: 'desc' };
    if (query.sort === 'oldest') {
      orderBy = { created_at: 'asc' };
    } else if (query.sort === 'price_asc') {
      orderBy = { base_price_in_paise: 'asc' };
    } else if (query.sort === 'price_desc') {
      orderBy = { base_price_in_paise: 'desc' };
    } else if (query.sort === 'name_asc') {
      orderBy = { name: 'asc' };
    }

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: {
          variants: {
            where: { deleted_at: null },
            include: {
              stock_levels: true,
            },
          },
          images: { orderBy: { sort_order: 'asc' } },
          category: {
            select: { id: true, name: true, slug: true, attribute_schema: true },
          },
          brand: {
            select: { id: true, name: true, slug: true, logo_url: true },
          },
          vendor: {
            select: { id: true, business_name: true, slug: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    // Calculate aggregated inventory numbers for quick UI badges
    const processedProducts = products.map((p) => {
      const totalStock = p.variants.reduce((acc, v) => {
        const variantStock = v.stock_levels.reduce((sAcc, s) => sAcc + s.quantity_on_hand, 0);
        return acc + variantStock;
      }, 0);

      const reservedStock = p.variants.reduce((acc, v) => {
        const variantReserved = v.stock_levels.reduce((sAcc, s) => sAcc + s.quantity_reserved, 0);
        return acc + variantReserved;
      }, 0);

      return {
        ...p,
        total_stock: totalStock,
        reserved_stock: reservedStock,
        variants_count: p.variants.length,
      };
    });

    return {
      items: serializeProduct(processedProducts),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneAdmin(id: string) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const product = await this.prisma.product.findFirst({
      where: isUUID ? { id, deleted_at: null } : { slug: id, deleted_at: null },
      include: {
        variants: {
          where: { deleted_at: null },
          include: {
            stock_levels: true,
          },
          orderBy: { created_at: 'asc' },
        },
        images: { orderBy: { sort_order: 'asc' } },
        category: {
          include: { parent: true },
        },
        brand: true,
        vendor: {
          select: { id: true, business_name: true, slug: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product not found`);
    }

    return serializeProduct(product);
  }

  async createAdmin(dto: CreateAdminProductDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.category_id },
    });

    if (!category || category.deleted_at) {
      throw new NotFoundException('Category not found');
    }

    // Resolve vendor: Use provided vendor_id or find the first active vendor
    let targetVendorId = dto.vendor_id;
    if (!targetVendorId) {
      const firstVendor = await this.prisma.vendorProfile.findFirst({
        where: { deleted_at: null },
      });
      if (!firstVendor) {
        throw new NotFoundException('No active vendor profile found to assign product to');
      }
      targetVendorId = firstVendor.id;
    }

    const baseSlug =
      dto.slug ||
      dto.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Check SKU uniqueness
    if (dto.variants && dto.variants.length > 0) {
      const skus = dto.variants.map((v) => v.sku);
      const existingSkus = await this.prisma.productVariant.findMany({
        where: { sku: { in: skus } },
      });
      if (existingSkus.length > 0) {
        throw new ConflictException(
          `SKUs already exist: ${existingSkus.map((s) => s.sku).join(', ')}`
        );
      }
    }

    // Get default warehouse for stock injection (V1 Single Warehouse)
    let defaultWarehouse = await this.prisma.warehouse.findFirst({
      where: { deleted_at: null },
    });
    if (!defaultWarehouse) {
      defaultWarehouse = await this.prisma.warehouse.create({
        data: {
          name: 'Primary Fulfillment Warehouse',
          code: 'WH-DEFAULT-MAIN',
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
        },
      });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          vendor_id: targetVendorId!,
          category_id: dto.category_id,
          brand_id: dto.brand_id || null,
          name: dto.name,
          slug,
          description: dto.description,
          attributes: (dto.attributes ?? {}) as any,
          status: dto.status ?? ProductStatus.DRAFT,
          base_price_in_paise: BigInt(dto.base_price_in_paise),
          compare_at_price_in_paise: dto.compare_at_price_in_paise
            ? BigInt(dto.compare_at_price_in_paise)
            : null,
          cost_price_in_paise: dto.cost_price_in_paise
            ? BigInt(dto.cost_price_in_paise)
            : null,
          tags: dto.tags ?? [],
          is_featured: dto.is_featured ?? false,
        },
      });

      // Create variants & default warehouse stock levels
      if (dto.variants && dto.variants.length > 0) {
        for (const v of dto.variants) {
          const variant = await tx.productVariant.create({
            data: {
              product_id: product.id,
              sku: v.sku,
              variant_attributes: (v.variant_attributes ?? {}) as any,
              price_in_paise: BigInt(v.price_in_paise),
              compare_at_price_in_paise: v.compare_at_price_in_paise
                ? BigInt(v.compare_at_price_in_paise)
                : null,
              weight_in_grams: v.weight_in_grams,
              barcode: v.barcode,
              is_active: v.is_active ?? true,
            },
          });

          // Initialize Stock Level
          await tx.stockLevel.create({
            data: {
              variant_id: variant.id,
              warehouse_id: defaultWarehouse.id,
              quantity_on_hand: v.initial_stock ?? 0,
              quantity_reserved: 0,
            },
          });
        }
      } else {
        // Create 1 default standard variant if no variant combinations were configured
        const standardVariant = await tx.productVariant.create({
          data: {
            product_id: product.id,
            sku: `${slug.toUpperCase().slice(0, 8)}-STD`,
            variant_attributes: {},
            price_in_paise: BigInt(dto.base_price_in_paise),
            compare_at_price_in_paise: dto.compare_at_price_in_paise
              ? BigInt(dto.compare_at_price_in_paise)
              : null,
            is_active: true,
          },
        });

        await tx.stockLevel.create({
          data: {
            variant_id: standardVariant.id,
            warehouse_id: defaultWarehouse.id,
            quantity_on_hand: 10,
            quantity_reserved: 0,
          },
        });
      }

      // Create images if provided
      if (dto.images && dto.images.length > 0) {
        await tx.productImage.createMany({
          data: dto.images.map((img, idx) => ({
            product_id: product.id,
            url: img.url,
            alt_text: img.alt_text,
            sort_order: img.sort_order ?? idx,
            is_primary: img.is_primary ?? idx === 0,
          })),
        });
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          variants: {
            include: { stock_levels: true },
          },
          images: { orderBy: { sort_order: 'asc' } },
          category: true,
          brand: true,
          vendor: true,
        },
      });
    });

    if (result) {
      this.eventEmitter.emit(
        'product.created',
        new ProductCreatedEvent(result.id, result.vendor_id, result.name, result.slug)
      );
    }

    return serializeProduct(result!);
  }

  async updateAdmin(id: string, dto: UpdateAdminProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!existing || existing.deleted_at) {
      throw new NotFoundException('Product not found');
    }

    if (dto.slug && dto.slug !== existing.slug) {
      const duplicateSlug = await this.prisma.product.findUnique({
        where: { slug: dto.slug },
      });
      if (duplicateSlug) {
        throw new ConflictException(`Product slug "${dto.slug}" already exists`);
      }
    }

    const defaultWarehouse = await this.prisma.warehouse.findFirst({
      where: { deleted_at: null },
    });

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: {
          name: dto.name,
          slug: dto.slug,
          category_id: dto.category_id,
          vendor_id: dto.vendor_id,
          brand_id: dto.brand_id === undefined ? undefined : dto.brand_id,
          description: dto.description,
          attributes: dto.attributes !== undefined ? (dto.attributes as any) : undefined,
          status: dto.status,
          base_price_in_paise:
            dto.base_price_in_paise !== undefined
              ? BigInt(dto.base_price_in_paise)
              : undefined,
          compare_at_price_in_paise:
            dto.compare_at_price_in_paise !== undefined
              ? BigInt(dto.compare_at_price_in_paise)
              : undefined,
          cost_price_in_paise:
            dto.cost_price_in_paise !== undefined
              ? BigInt(dto.cost_price_in_paise)
              : undefined,
          tags: dto.tags,
          is_featured: dto.is_featured,
        },
      });

      // Sync Variants if provided
      if (dto.variants && dto.variants.length > 0) {
        for (const v of dto.variants) {
          const existingVariant = await tx.productVariant.findFirst({
            where: { product_id: id, sku: v.sku },
          });

          if (existingVariant) {
            await tx.productVariant.update({
              where: { id: existingVariant.id },
              data: {
                variant_attributes: (v.variant_attributes ?? {}) as any,
                price_in_paise: BigInt(v.price_in_paise),
                compare_at_price_in_paise: v.compare_at_price_in_paise
                  ? BigInt(v.compare_at_price_in_paise)
                  : null,
                weight_in_grams: v.weight_in_grams,
                barcode: v.barcode,
                is_active: v.is_active ?? true,
              },
            });

            if (v.initial_stock !== undefined && defaultWarehouse) {
              await tx.stockLevel.upsert({
                where: {
                  variant_id_warehouse_id: {
                    variant_id: existingVariant.id,
                    warehouse_id: defaultWarehouse.id,
                  },
                },
                update: { quantity_on_hand: v.initial_stock },
                create: {
                  variant_id: existingVariant.id,
                  warehouse_id: defaultWarehouse.id,
                  quantity_on_hand: v.initial_stock,
                  quantity_reserved: 0,
                },
              });
            }
          } else {
            const newVar = await tx.productVariant.create({
              data: {
                product_id: id,
                sku: v.sku,
                variant_attributes: (v.variant_attributes ?? {}) as any,
                price_in_paise: BigInt(v.price_in_paise),
                compare_at_price_in_paise: v.compare_at_price_in_paise
                  ? BigInt(v.compare_at_price_in_paise)
                  : null,
                weight_in_grams: v.weight_in_grams,
                barcode: v.barcode,
                is_active: v.is_active ?? true,
              },
            });

            if (defaultWarehouse) {
              await tx.stockLevel.create({
                data: {
                  variant_id: newVar.id,
                  warehouse_id: defaultWarehouse.id,
                  quantity_on_hand: v.initial_stock ?? 0,
                  quantity_reserved: 0,
                },
              });
            }
          }
        }
      }

      // Sync Images if provided
      if (dto.images !== undefined) {
        await tx.productImage.deleteMany({ where: { product_id: id } });
        if (dto.images.length > 0) {
          await tx.productImage.createMany({
            data: dto.images.map((img, idx) => ({
              product_id: id,
              url: img.url,
              alt_text: img.alt_text,
              sort_order: img.sort_order ?? idx,
              is_primary: img.is_primary ?? idx === 0,
            })),
          });
        }
      }

      return tx.product.findUnique({
        where: { id },
        include: {
          variants: { include: { stock_levels: true } },
          images: { orderBy: { sort_order: 'asc' } },
          category: true,
          brand: true,
          vendor: true,
        },
      });
    });

    if (result) {
      this.eventEmitter.emit(
        'product.updated',
        new ProductUpdatedEvent(result.id, result.vendor_id, result.name, result.slug)
      );
    }

    return serializeProduct(result!);
  }

  async deleteAdmin(id: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing || existing.deleted_at) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        status: ProductStatus.ARCHIVED,
      },
    });
  }

  async toggleStatusAdmin(id: string, status: ProductStatus) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing || existing.deleted_at) {
      throw new NotFoundException('Product not found');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { status },
    });

    return serializeProduct(updated);
  }
}

