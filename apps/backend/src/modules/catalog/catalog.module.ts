import { Module } from '@nestjs/common';
import { CategoriesService } from './services/categories.service';
import { CategoriesController } from './controllers/categories.controller';
import { ProductsService } from './services/products.service';
import { ProductsController } from './controllers/products.controller';
import { VendorProductsController } from './controllers/vendor-products.controller';
import { AdminProductsController } from './controllers/admin-products.controller';

@Module({
  controllers: [
    CategoriesController,
    ProductsController,
    VendorProductsController,
    AdminProductsController,
  ],
  providers: [CategoriesService, ProductsService],
  exports: [CategoriesService, ProductsService],
})
export class CatalogModule {}

