import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AffiliatesService } from '../services/affiliates.service';
import { CommissionService } from '../services/commission.service';
import { UpdateAffiliateTierDto } from '../dto/update-tier.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@ezzy-ecomm/database';

@Controller('admin/affiliates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminAffiliatesController {
  constructor(
    private readonly affiliatesService: AffiliatesService,
    private readonly commissionService: CommissionService
  ) {}

  @Get()
  async listAffiliates(
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.affiliatesService.listAffiliatesAdmin(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20
    );
  }

  @Patch(':id/tier')
  async updateTier(
    @Param('id') id: string,
    @Body() dto: UpdateAffiliateTierDto
  ) {
    return this.affiliatesService.updateAffiliateTier(
      id,
      dto.tier,
      dto.status,
      dto.commission_rate_override
    );
  }

  @Post('orders/:orderId/approve-commissions')
  async approveCommissions(@Param('orderId') orderId: string) {
    return this.commissionService.approveCommissionsForOrder(orderId);
  }
}
