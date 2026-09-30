import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { SeoService } from '../services/seo.service';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { UserRole } from '@ezzy-ecomm/database';

@Controller('seo')
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Public()
  @Get('products/:productId')
  async getProductSeo(@Param('productId') productId: string) {
    return this.seoService.getProductSeo(productId);
  }

  @Post('admin/generate-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async generateAll() {
    return this.seoService.generateAllProductsSeo();
  }
}
