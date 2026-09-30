import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingsService } from './embeddings.service';
import { SemanticSearchDto } from '../dto/semantic-search.dto';
import { ReindexCatalogDto } from '../dto/reindex-catalog.dto';

export interface SemanticSearchResult {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price_in_paise: number;
  compare_at_price_in_paise: number | null;
  attributes: Record<string, unknown>;
  tags: string[];
  is_featured: boolean;
  category_id: string;
  category_name: string;
  category_slug: string;
  brand_id: string | null;
  brand_name: string | null;
  similarity_score: number;
  images: Array<{ url: string; alt_text: string | null; is_primary: boolean }>;
  variants: Array<{
    id: string;
    sku: string;
    price_in_paise: number;
    variant_attributes: Record<string, unknown>;
  }>;
}

interface RawSearchResult {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price_in_paise: bigint;
  compare_at_price_in_paise: bigint | null;
  attributes: Record<string, unknown>;
  tags: string[];
  is_featured: boolean;
  category_id: string;
  category_name: string;
  category_slug: string;
  brand_id: string | null;
  brand_name: string | null;
  similarity_score: number;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingsService: EmbeddingsService
  ) {}

  async onModuleInit() {
    await this.ensureVectorIndex();
  }

  /**
   * Ensures HNSW index exists on the vector column for fast cosine distance matching
   */
  async ensureVectorIndex(): Promise<void> {
    try {
      await this.prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS product_embedding_hnsw_idx 
        ON "catalog"."ProductEmbedding" 
        USING hnsw (embedding vector_cosine_ops);
      `);
      this.logger.log('pgvector HNSW index verified on "catalog"."ProductEmbedding"');
    } catch (err: unknown) {
      this.logger.warn(`Could not create HNSW vector index: ${(err as Error).message}`);
    }
  }

  /**
   * Generates a composite search document for a product from its name, category, brand, specs, tags, and description
   */
  private buildSearchDocument(product: {
    name: string;
    description: string | null;
    tags: string[];
    attributes: unknown;
    category?: { name: string } | null;
    brand?: { name: string } | null;
  }): string {
    const parts: string[] = [];
    parts.push(product.name);

    if (product.category?.name) {
      parts.push(`Category: ${product.category.name}`);
    }
    if (product.brand?.name) {
      parts.push(`Brand: ${product.brand.name}`);
    }
    if (product.tags && product.tags.length > 0) {
      parts.push(`Tags: ${product.tags.join(', ')}`);
    }
    if (product.attributes && typeof product.attributes === 'object') {
      const attrs = Object.entries(product.attributes as Record<string, unknown>)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      if (attrs) parts.push(`Specifications: ${attrs}`);
    }
    if (product.description) {
      parts.push(product.description);
    }

    return parts.join('. ');
  }

  /**
   * Generates embedding and stores it in catalog.ProductEmbedding
   */
  async indexProduct(productId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
      },
    });

    if (!product || product.deleted_at || product.status !== 'ACTIVE') {
      return;
    }

    const docText = this.buildSearchDocument(product);
    const vector = await this.embeddingsService.generateEmbedding(docText);
    const vectorString = `[${vector.join(',')}]`;

    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO "catalog"."ProductEmbedding" (id, product_id, embedding, model_version, updated_at)
      VALUES (gen_random_uuid(), $1::uuid, $2::vector, 'text-embedding-3-small', NOW())
      ON CONFLICT (product_id)
      DO UPDATE SET 
        embedding = EXCLUDED.embedding, 
        model_version = EXCLUDED.model_version, 
        updated_at = NOW();
      `,
      productId,
      vectorString
    );
  }

  /**
   * Batch re-index catalog products into pgvector
   */
  async reindexCatalog(dto: ReindexCatalogDto = {}): Promise<{ total_indexed: number; duration_ms: number }> {
    const startTime = Date.now();
    const whereCondition: Record<string, unknown> = {
      status: 'ACTIVE',
      deleted_at: null,
    };

    const products = await this.prisma.product.findMany({
      where: whereCondition,
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
      },
    });

    let indexedCount = 0;
    for (const product of products) {
      if (dto.unindexed_only) {
        const existing = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
          `SELECT count(*)::bigint FROM "catalog"."ProductEmbedding" WHERE product_id = $1::uuid`,
          product.id
        );
        if (existing.length > 0 && Number(existing[0].count) > 0) {
          continue;
        }
      }

      const docText = this.buildSearchDocument(product);
      const vector = await this.embeddingsService.generateEmbedding(docText);
      const vectorString = `[${vector.join(',')}]`;

      await this.prisma.$executeRawUnsafe(
        `
        INSERT INTO "catalog"."ProductEmbedding" (id, product_id, embedding, model_version, updated_at)
        VALUES (gen_random_uuid(), $1::uuid, $2::vector, 'text-embedding-3-small', NOW())
        ON CONFLICT (product_id)
        DO UPDATE SET 
          embedding = EXCLUDED.embedding, 
          model_version = EXCLUDED.model_version, 
          updated_at = NOW();
        `,
        product.id,
        vectorString
      );
      indexedCount++;
    }

    const duration = Date.now() - startTime;
    this.logger.log(`Catalog reindexed: ${indexedCount} products in ${duration}ms`);
    return { total_indexed: indexedCount, duration_ms: duration };
  }

  /**
   * Performs semantic similarity search using pgvector cosine distance (<=>) with hybrid SQL filtering
   */
  async semanticSearch(dto: SemanticSearchDto): Promise<{
    query: string;
    total: number;
    results: SemanticSearchResult[];
  }> {
    const queryVector = await this.embeddingsService.generateEmbedding(dto.q);
    const vectorString = `[${queryVector.join(',')}]`;

    const threshold = dto.threshold ?? 0.3;
    const limit = dto.limit ?? 20;
    const offset = dto.offset ?? 0;

    // Build dynamic SQL where conditions
    const whereConditions: string[] = [
      `p.status = 'ACTIVE'`,
      `p.deleted_at IS NULL`,
      `pe.embedding IS NOT NULL`,
      `(1 - (pe.embedding <=> $1::vector)) >= $2`,
    ];
    const params: unknown[] = [vectorString, threshold];
    let paramIndex = 3;

    if (dto.category_id) {
      whereConditions.push(`p.category_id = $${paramIndex}::uuid`);
      params.push(dto.category_id);
      paramIndex++;
    }

    if (dto.brand_id) {
      whereConditions.push(`p.brand_id = $${paramIndex}::uuid`);
      params.push(dto.brand_id);
      paramIndex++;
    }

    if (dto.min_price !== undefined) {
      whereConditions.push(`p.base_price_in_paise >= $${paramIndex}::bigint`);
      params.push(BigInt(dto.min_price));
      paramIndex++;
    }

    if (dto.max_price !== undefined) {
      whereConditions.push(`p.base_price_in_paise <= $${paramIndex}::bigint`);
      params.push(BigInt(dto.max_price));
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Main ranked search query
    const sql = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.base_price_in_paise,
        p.compare_at_price_in_paise,
        p.attributes,
        p.tags,
        p.is_featured,
        p.category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        p.brand_id,
        b.name AS brand_name,
        ROUND((1 - (pe.embedding <=> $1::vector))::numeric, 4)::float AS similarity_score
      FROM "catalog"."Product" p
      JOIN "catalog"."ProductEmbedding" pe ON p.id = pe.product_id
      JOIN "catalog"."Category" c ON p.category_id = c.id
      LEFT JOIN "catalog"."Brand" b ON p.brand_id = b.id
      WHERE ${whereClause}
      ORDER BY similarity_score DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;

    params.push(limit, offset);

    const rawResults = await this.prisma.$queryRawUnsafe<RawSearchResult[]>(sql, ...params);

    if (rawResults.length === 0) {
      return { query: dto.q, total: 0, results: [] };
    }

    // Fetch images and active variants for all returned product IDs
    const productIds = rawResults.map((r) => r.id);
    const [images, variants] = await Promise.all([
      this.prisma.productImage.findMany({
        where: { product_id: { in: productIds } },
        orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }],
      }),
      this.prisma.productVariant.findMany({
        where: { product_id: { in: productIds }, is_active: true, deleted_at: null },
      }),
    ]);

    const imagesByProductId = new Map<string, Array<{ url: string; alt_text: string | null; is_primary: boolean }>>();
    for (const img of images) {
      if (!imagesByProductId.has(img.product_id)) {
        imagesByProductId.set(img.product_id, []);
      }
      imagesByProductId.get(img.product_id)!.push({
        url: img.url,
        alt_text: img.alt_text,
        is_primary: img.is_primary,
      });
    }

    const variantsByProductId = new Map<
      string,
      Array<{ id: string; sku: string; price_in_paise: number; variant_attributes: Record<string, unknown> }>
    >();
    for (const v of variants) {
      if (!variantsByProductId.has(v.product_id)) {
        variantsByProductId.set(v.product_id, []);
      }
      variantsByProductId.get(v.product_id)!.push({
        id: v.id,
        sku: v.sku,
        price_in_paise: Number(v.price_in_paise),
        variant_attributes: (v.variant_attributes as Record<string, unknown>) || {},
      });
    }

    const results: SemanticSearchResult[] = rawResults.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      base_price_in_paise: Number(r.base_price_in_paise),
      compare_at_price_in_paise: r.compare_at_price_in_paise ? Number(r.compare_at_price_in_paise) : null,
      attributes: (r.attributes as Record<string, unknown>) || {},
      tags: r.tags || [],
      is_featured: r.is_featured,
      category_id: r.category_id,
      category_name: r.category_name,
      category_slug: r.category_slug,
      brand_id: r.brand_id,
      brand_name: r.brand_name,
      similarity_score: r.similarity_score,
      images: imagesByProductId.get(r.id) || [],
      variants: variantsByProductId.get(r.id) || [],
    }));

    return {
      query: dto.q,
      total: results.length,
      results,
    };
  }
}
