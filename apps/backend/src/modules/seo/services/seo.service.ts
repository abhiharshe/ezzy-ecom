import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

function serializeData<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) =>
      typeof value === 'bigint' ? Number(value) : value
    )
  );
}

@Injectable()
export class SeoService {
  private readonly logger = new Logger(SeoService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates Schema.org JSON-LD and meta tags for a product
   */
  async generateProductSeo(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        brand: true,
        vendor: { select: { business_name: true, slug: true } },
        images: { orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }] },
        variants: { where: { is_active: true, deleted_at: null } },
        reviews: { where: { is_published: true, deleted_at: null } },
      },
    });

    if (!product || product.deleted_at) {
      this.logger.warn(`Product ${productId} not found for SEO generation`);
      return null;
    }

    // 1. Meta Title (Max 60 chars recommended by Google)
    const brandPrefix = product.brand?.name ? `${product.brand.name} ` : '';
    const baseTitle = `${brandPrefix}${product.name}`;
    const metaTitle = baseTitle.length > 50 ? `${baseTitle.slice(0, 47)}...` : `${baseTitle} | EzzyEcomm`;

    // 2. Meta Description (Max 160 chars)
    let metaDesc = product.description || `Shop ${product.name} online at best prices. Fast delivery & easy returns.`;
    metaDesc = metaDesc.replace(/(\r\n|\n|\r)/gm, ' ').replace(/\s+/g, ' ').trim();
    if (metaDesc.length > 155) {
      metaDesc = `${metaDesc.slice(0, 152)}...`;
    }

    // 3. Keywords
    const keywordsSet = new Set<string>();
    if (product.tags) {
      product.tags.forEach((t) => keywordsSet.add(t.toLowerCase()));
    }
    if (product.category?.name) {
      keywordsSet.add(product.category.name.toLowerCase());
    }
    if (product.brand?.name) {
      keywordsSet.add(product.brand.name.toLowerCase());
    }
    const keywords = Array.from(keywordsSet);

    // 4. Schema.org Product JSON-LD Markup
    const primaryImage = product.images.find((img) => img.is_primary)?.url || product.images[0]?.url;
    const priceInRupees = (Number(product.base_price_in_paise) / 100).toFixed(2);

    const offers = product.variants.map((v) => ({
      '@type': 'Offer',
      sku: v.sku,
      price: (Number(v.price_in_paise) / 100).toFixed(2),
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: `https://ezzyecomm.com/products/${product.slug}?sku=${v.sku}`,
      itemCondition: 'https://schema.org/NewCondition',
    }));

    const jsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: metaDesc,
      image: primaryImage ? [primaryImage] : [],
      sku: product.variants[0]?.sku || product.slug,
      offers: offers.length === 1 ? offers[0] : offers,
    };

    if (product.brand?.name) {
      jsonLd.brand = {
        '@type': 'Brand',
        name: product.brand.name,
      };
    }

    // Aggregate rating if reviews exist
    if (product.reviews.length > 0) {
      const avgRating =
        product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;
      jsonLd.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: avgRating.toFixed(1),
        reviewCount: product.reviews.length,
      };
    }

    // 5. Upsert ProductSeo
    const seo = await this.prisma.productSeo.upsert({
      where: { product_id: productId },
      create: {
        product_id: productId,
        meta_title: metaTitle,
        meta_description: metaDesc,
        keywords,
        og_title: metaTitle,
        og_description: metaDesc,
        og_image_url: primaryImage || null,
        canonical_url: `https://ezzyecomm.com/products/${product.slug}`,
        json_ld: jsonLd as any,
        generated_by_ai: true,
        model_version: 'ai-seo-v1',
        generated_at: new Date(),
      },
      update: {
        meta_title: metaTitle,
        meta_description: metaDesc,
        keywords,
        og_title: metaTitle,
        og_description: metaDesc,
        og_image_url: primaryImage || null,
        canonical_url: `https://ezzyecomm.com/products/${product.slug}`,
        json_ld: jsonLd as any,
        generated_by_ai: true,
        model_version: 'ai-seo-v1',
        generated_at: new Date(),
      },
    });

    this.logger.log(`Generated SEO & Schema.org JSON-LD for product ${productId} (${product.name})`);
    return serializeData(seo);
  }

  /**
   * Get SEO metadata for product
   */
  async getProductSeo(productId: string) {
    const seo = await this.prisma.productSeo.findUnique({
      where: { product_id: productId },
    });

    if (!seo) {
      // Generate on-demand if not found
      return this.generateProductSeo(productId);
    }

    return serializeData(seo);
  }

  /**
   * Batch generate SEO for all active catalog products
   */
  async generateAllProductsSeo() {
    const products = await this.prisma.product.findMany({
      where: { status: 'ACTIVE', deleted_at: null },
      select: { id: true },
    });

    let count = 0;
    for (const p of products) {
      await this.generateProductSeo(p.id);
      count++;
    }

    return { total_processed: count };
  }
}
