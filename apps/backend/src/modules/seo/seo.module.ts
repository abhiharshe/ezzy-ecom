import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SeoService } from './services/seo.service';
import { SeoWorkerListener } from './services/seo-worker.listener';
import { SeoController } from './controllers/seo.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SeoController],
  providers: [SeoService, SeoWorkerListener],
  exports: [SeoService],
})
export class SeoModule {}
