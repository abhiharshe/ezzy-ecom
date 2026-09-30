import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole } from '@ezzy-ecomm/database';
import { InventoryService } from './inventory.service';
import { UpdateStockDto } from './dto/update-stock.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { VendorTenantGuard } from '../../common/guards/vendor-tenant.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentVendor } from '../../common/decorators/current-vendor.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Public()
  @Get('inventory/variants/:variantId')
  async getStock(@Param('variantId') variantId: string) {
    return this.inventoryService.getStockLevel(variantId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard, VendorTenantGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('vendor/inventory/variants/:variantId')
  @HttpCode(HttpStatus.OK)
  async updateStock(
    @CurrentVendor() vendorId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateStockDto
  ) {
    return this.inventoryService.setStock(vendorId, variantId, dto);
  }
}
