import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from '../orders.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { QueryOrdersDto } from '../dto/query-orders.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/auth-user.interface';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  async checkout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrderDto
  ) {
    return this.ordersService.checkout(user.id, dto);
  }

  @Get()
  async findCustomerOrders(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryOrdersDto
  ) {
    return this.ordersService.findCustomerOrders(user.id, query);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') orderId: string
  ) {
    return this.ordersService.findCustomerOrderById(user.id, orderId);
  }
}
