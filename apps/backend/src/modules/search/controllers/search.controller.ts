import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { SearchService } from '../services/search.service';
import { SemanticSearchDto } from '../dto/semantic-search.dto';
import { ReindexCatalogDto } from '../dto/reindex-catalog.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { UserRole } from '@ezzy-ecomm/database';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get('semantic')
  async semanticSearch(@Query() query: SemanticSearchDto) {
    return this.searchService.semanticSearch(query);
  }

  @Post('reindex')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async reindexCatalog(@Body() dto: ReindexCatalogDto) {
    return this.searchService.reindexCatalog(dto);
  }
}
