import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './controllers/orders.controller';
import { VendorOrdersController } from './controllers/vendor-orders.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { AffiliatesModule } from '../affiliates/affiliates.module';

@Module({
  imports: [InventoryModule, AffiliatesModule],
  controllers: [OrdersController, VendorOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
