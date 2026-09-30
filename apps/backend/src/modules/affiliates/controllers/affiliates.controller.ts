import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AffiliatesService } from '../services/affiliates.service';
import { AffiliateLinksService } from '../services/affiliate-links.service';
import { CommissionService } from '../services/commission.service';
import { OnboardAffiliateDto } from '../dto/onboard-affiliate.dto';
import { CreateAffiliateLinkDto } from '../dto/create-affiliate-link.dto';
import { QueryCommissionsDto } from '../dto/query-commissions.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@ezzy-ecomm/database';

@Controller('affiliates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AffiliatesController {
  constructor(
    private readonly affiliatesService: AffiliatesService,
    private readonly linksService: AffiliateLinksService,
    private readonly commissionService: CommissionService
  ) {}

  @Post('onboard')
  async onboard(
    @CurrentUser('id') userId: string,
    @Body() dto: OnboardAffiliateDto
  ) {
    return this.affiliatesService.onboardAffiliate(userId, dto);
  }

  @Get('me')
  @Roles(UserRole.AFFILIATE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getDashboard(@CurrentUser('id') userId: string) {
    return this.affiliatesService.getAffiliateDashboard(userId);
  }

  @Post('links')
  @Roles(UserRole.AFFILIATE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createLink(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAffiliateLinkDto
  ) {
    return this.linksService.createLink(userId, dto);
  }

  @Get('links')
  @Roles(UserRole.AFFILIATE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getLinks(@CurrentUser('id') userId: string) {
    return this.linksService.getMyLinks(userId);
  }

  @Get('commissions')
  @Roles(UserRole.AFFILIATE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getCommissions(
    @CurrentUser('id') userId: string,
    @Query() query: QueryCommissionsDto
  ) {
    return this.commissionService.getAffiliateCommissions(userId, query);
  }

  @Get('network')
  @Roles(UserRole.AFFILIATE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getDownlineNetwork(@CurrentUser('id') userId: string) {
    return this.affiliatesService.getDownlineNetwork(userId);
  }

  @Get('ledger')
  @Roles(UserRole.AFFILIATE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getLedger(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.commissionService.getAffiliateLedger(
      userId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20
    );
  }
}
