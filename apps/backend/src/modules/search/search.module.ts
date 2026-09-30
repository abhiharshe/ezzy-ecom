import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { EmbeddingsService } from './services/embeddings.service';
import { SearchService } from './services/search.service';
import { SearchController } from './controllers/search.controller';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [SearchController],
  providers: [EmbeddingsService, SearchService],
  exports: [SearchService, EmbeddingsService],
})
export class SearchModule {}
