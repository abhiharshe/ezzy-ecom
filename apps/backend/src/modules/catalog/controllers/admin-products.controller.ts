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
import { UserRole, ProductStatus } from '@ezzy-ecomm/database';
import { ProductsService } from '../services/products.service';
import { CreateAdminProductDto, UpdateAdminProductDto } from '../dto/product/create-admin-product.dto';
import { QueryAdminProductsDto } from '../dto/product/query-admin-products.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';

@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Query() query: QueryAdminProductsDto) {
    return this.productsService.findAllAdmin(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOneAdmin(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateAdminProductDto) {
    return this.productsService.createAdmin(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAdminProductDto) {
    return this.productsService.updateAdmin(id, dto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ProductStatus
  ) {
    return this.productsService.toggleStatusAdmin(id, status);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.productsService.deleteAdmin(id);
  }
}
