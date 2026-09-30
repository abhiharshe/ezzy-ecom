import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SeoService } from './seo.service';
import { ProductCreatedEvent, ProductUpdatedEvent } from '../../../common/events/product-events';

@Injectable()
export class SeoWorkerListener {
  private readonly logger = new Logger(SeoWorkerListener.name);

  constructor(private readonly seoService: SeoService) {}

  @OnEvent('product.created', { async: true })
  async handleProductCreated(event: ProductCreatedEvent) {
    this.logger.log(`[Background Worker] Handling product.created for ${event.productId}`);
    try {
      await this.seoService.generateProductSeo(event.productId);
    } catch (err: unknown) {
      this.logger.error(
        `Failed to generate SEO for product ${event.productId}: ${(err as Error).message}`
      );
    }
  }

  @OnEvent('product.updated', { async: true })
  async handleProductUpdated(event: ProductUpdatedEvent) {
    this.logger.log(`[Background Worker] Handling product.updated for ${event.productId}`);
    try {
      await this.seoService.generateProductSeo(event.productId);
    } catch (err: unknown) {
      this.logger.error(
        `Failed to update SEO for product ${event.productId}: ${(err as Error).message}`
      );
    }
  }
}
