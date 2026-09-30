import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole } from '@ezzy-ecomm/database';
import { OrdersService } from '../orders.service';
import { UpdateSubOrderStatusDto } from '../dto/update-suborder-status.dto';
import { QueryOrdersDto } from '../dto/query-orders.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { VendorTenantGuard } from '../../../common/guards/vendor-tenant.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentVendor } from '../../../common/decorators/current-vendor.decorator';

@Controller('vendor/orders')
@UseGuards(JwtAuthGuard, RolesGuard, VendorTenantGuard)
@Roles(UserRole.VENDOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class VendorOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async findVendorSubOrders(
    @CurrentVendor() vendorId: string,
    @Query() query: QueryOrdersDto
  ) {
    return this.ordersService.findVendorSubOrders(vendorId, query);
  }

  @Get(':subOrderId')
  async findOne(
    @CurrentVendor() vendorId: string,
    @Param('subOrderId') subOrderId: string
  ) {
    return this.ordersService.findVendorSubOrderById(vendorId, subOrderId);
  }

  @Patch(':subOrderId/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @CurrentVendor() vendorId: string,
    @Param('subOrderId') subOrderId: string,
    @Body() dto: UpdateSubOrderStatusDto
  ) {
    return this.ordersService.updateSubOrderStatus(vendorId, subOrderId, dto);
  }
}
