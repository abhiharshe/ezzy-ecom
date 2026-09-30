import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole } from '@ezzy-ecomm/database';
import { ProductsService } from '../services/products.service';
import { CreateProductDto } from '../dto/product/create-product.dto';
import { UpdateProductDto } from '../dto/product/update-product.dto';
import { QueryProductsDto } from '../dto/product/query-products.dto';
import { CreateVariantDto } from '../dto/variant/create-variant.dto';
import { UpdateVariantDto } from '../dto/variant/update-variant.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { VendorTenantGuard } from '../../../common/guards/vendor-tenant.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentVendor } from '../../../common/decorators/current-vendor.decorator';

@Controller('vendor/products')
@UseGuards(JwtAuthGuard, RolesGuard, VendorTenantGuard)
@Roles(UserRole.VENDOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class VendorProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findVendorProducts(
    @CurrentVendor() vendorId: string,
    @Query() query: QueryProductsDto
  ) {
    return this.productsService.findVendorProducts(vendorId, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createProduct(
    @CurrentVendor() vendorId: string,
    @Body() dto: CreateProductDto
  ) {
    return this.productsService.createProduct(vendorId, dto);
  }

  @Get(':id')
  async findOne(
    @CurrentVendor() vendorId: string,
    @Param('id') productId: string
  ) {
    return this.productsService.findVendorProductById(vendorId, productId);
  }

  @Patch(':id')
  async updateProduct(
    @CurrentVendor() vendorId: string,
    @Param('id') productId: string,
    @Body() dto: UpdateProductDto
  ) {
    return this.productsService.updateProduct(vendorId, productId, dto);
  }

  @Post(':id/variants')
  @HttpCode(HttpStatus.CREATED)
  async addVariant(
    @CurrentVendor() vendorId: string,
    @Param('id') productId: string,
    @Body() dto: CreateVariantDto
  ) {
    return this.productsService.addVariant(vendorId, productId, dto);
  }

  @Patch(':id/variants/:variantId')
  async updateVariant(
    @CurrentVendor() vendorId: string,
    @Param('id') productId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto
  ) {
    return this.productsService.updateVariant(
      vendorId,
      productId,
      variantId,
      dto
    );
  }

  @Delete(':id')
  async deleteProduct(
    @CurrentVendor() vendorId: string,
    @Param('id') productId: string
  ) {
    return this.productsService.deleteProduct(vendorId, productId);
  }
}
