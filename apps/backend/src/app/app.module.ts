import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../modules/prisma/prisma.module';
import { AuthModule } from '../modules/auth/auth.module';
import { CatalogModule } from '../modules/catalog/catalog.module';
import { InventoryModule } from '../modules/inventory/inventory.module';
import { OrdersModule } from '../modules/orders/orders.module';
import { SearchModule } from '../modules/search/search.module';
import { AffiliatesModule } from '../modules/affiliates/affiliates.module';
import { SeoModule } from '../modules/seo/seo.module';
import { PaymentsModule } from '../modules/payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),
    PrismaModule,
    AuthModule,
    CatalogModule,
    InventoryModule,
    OrdersModule,
    SearchModule,
    AffiliatesModule,
    SeoModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
