import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AffiliatesService } from './services/affiliates.service';
import { AffiliateLinksService } from './services/affiliate-links.service';
import { CommissionService } from './services/commission.service';
import { AffiliatesController } from './controllers/affiliates.controller';
import { AffiliateTrackingController } from './controllers/affiliate-tracking.controller';
import { AdminAffiliatesController } from './controllers/admin-affiliates.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    AffiliatesController,
    AffiliateTrackingController,
    AdminAffiliatesController,
  ],
  providers: [AffiliatesService, AffiliateLinksService, CommissionService],
  exports: [AffiliatesService, AffiliateLinksService, CommissionService],
})
export class AffiliatesModule {}
