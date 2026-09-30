import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OnboardAffiliateDto } from '../dto/onboard-affiliate.dto';
import { AffiliateTier, AffiliateStatus, UserRole } from '@ezzy-ecomm/database';

function serializeData<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) =>
      typeof value === 'bigint' ? Number(value) : value
    )
  );
}

@Injectable()
export class AffiliatesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Onboard an authenticated user as an affiliate partner
   */
  async onboardAffiliate(userId: string, dto: OnboardAffiliateDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { affiliate_profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.affiliate_profile) {
      throw new ConflictException('User is already registered as an affiliate');
    }

    // Resolve Upline Affiliate if provided
    let uplineAffiliateId: string | null = null;
    if (dto.upline_referral_code) {
      const upline = await this.prisma.affiliateProfile.findUnique({
        where: { referral_code: dto.upline_referral_code },
      });
      if (!upline) {
        throw new BadRequestException(`Upline referral code "${dto.upline_referral_code}" does not exist`);
      }
      uplineAffiliateId = upline.id;
    }

    // Determine referral code
    let referralCode: string;
    if (dto.custom_referral_code) {
      const existingCode = await this.prisma.affiliateProfile.findUnique({
        where: { referral_code: dto.custom_referral_code },
      });
      if (existingCode) {
        throw new ConflictException(`Referral code "${dto.custom_referral_code}" is already taken`);
      }
      referralCode = dto.custom_referral_code.toUpperCase();
    } else {
      const prefix = `${user.first_name.slice(0, 3).toUpperCase()}`;
      referralCode = `REF-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const affiliate = await this.prisma.$transaction(async (tx) => {
      // Add AFFILIATE to user roles if not present
      if (!user.roles.includes(UserRole.AFFILIATE)) {
        await tx.user.update({
          where: { id: userId },
          data: {
            roles: { set: [...user.roles, UserRole.AFFILIATE] },
          },
        });
      }

      return tx.affiliateProfile.create({
        data: {
          user_id: userId,
          referral_code: referralCode,
          tier: AffiliateTier.BRONZE,
          upline_affiliate_id: uplineAffiliateId,
          status: AffiliateStatus.ACTIVE,
          bank_payout_details: (dto.bank_payout_details as any) || {},
        },
        include: {
          upline: { select: { id: true, referral_code: true, tier: true } },
        },
      });
    });

    return serializeData(affiliate);
  }

  /**
   * Get affiliate dashboard stats and financial summary
   */
  async getAffiliateDashboard(userId: string) {
    const profile = await this.prisma.affiliateProfile.findUnique({
      where: { user_id: userId },
      include: {
        upline: {
          select: { id: true, referral_code: true, tier: true },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Affiliate profile not found for user');
    }

    // Aggregate commissions
    const [
      pendingCommissions,
      approvedCommissions,
      paidCommissions,
      linksCount,
      downlineCount,
      latestLedger,
    ] = await Promise.all([
      this.prisma.affiliateCommission.aggregate({
        where: { affiliate_id: profile.id, status: 'PENDING' },
        _sum: { commission_in_paise: true },
        _count: true,
      }),
      this.prisma.affiliateCommission.aggregate({
        where: { affiliate_id: profile.id, status: 'APPROVED' },
        _sum: { commission_in_paise: true },
        _count: true,
      }),
      this.prisma.affiliateCommission.aggregate({
        where: { affiliate_id: profile.id, status: 'PAID' },
        _sum: { commission_in_paise: true },
        _count: true,
      }),
      this.prisma.affiliateLink.count({
        where: { affiliate_id: profile.id },
      }),
      this.prisma.affiliateProfile.count({
        where: { upline_affiliate_id: profile.id },
      }),
      this.prisma.commissionLedger.findFirst({
        where: { affiliate_id: profile.id },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    const pendingPaise = pendingCommissions._sum.commission_in_paise ?? BigInt(0);
    const approvedPaise = approvedCommissions._sum.commission_in_paise ?? BigInt(0);
    const paidPaise = paidCommissions._sum.commission_in_paise ?? BigInt(0);
    const balancePaise = latestLedger?.balance_after_in_paise ?? approvedPaise;

    return serializeData({
      profile,
      metrics: {
        current_balance_in_paise: balancePaise,
        pending_commissions_in_paise: pendingPaise,
        approved_commissions_in_paise: approvedPaise,
        lifetime_paid_in_paise: paidPaise,
        total_commissions_count:
          pendingCommissions._count + approvedCommissions._count + paidCommissions._count,
        total_active_links: linksCount,
        total_downlines: downlineCount,
      },
    });
  }

  /**
   * Get downline affiliate network
   */
  async getDownlineNetwork(userId: string) {
    const profile = await this.prisma.affiliateProfile.findUnique({
      where: { user_id: userId },
    });

    if (!profile) {
      throw new NotFoundException('Affiliate profile not found');
    }

    const downlines = await this.prisma.affiliateProfile.findMany({
      where: { upline_affiliate_id: profile.id, deleted_at: null },
      include: {
        user: { select: { first_name: true, last_name: true, email: true } },
        _count: { select: { links: true, commissions: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return serializeData({
      affiliate_id: profile.id,
      referral_code: profile.referral_code,
      tier: profile.tier,
      total_downlines: downlines.length,
      downlines,
    });
  }

  /**
   * Admin: List all affiliates
   */
  async listAffiliatesAdmin(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, affiliates] = await Promise.all([
      this.prisma.affiliateProfile.count({ where: { deleted_at: null } }),
      this.prisma.affiliateProfile.findMany({
        where: { deleted_at: null },
        include: {
          user: { select: { first_name: true, last_name: true, email: true } },
          upline: { select: { id: true, referral_code: true } },
          _count: { select: { downlines: true, commissions: true, links: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return serializeData({
      items: affiliates,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  }

  /**
   * Admin: Update tier or status
   */
  async updateAffiliateTier(affiliateId: string, tier?: AffiliateTier, status?: AffiliateStatus, override?: number) {
    const affiliate = await this.prisma.affiliateProfile.update({
      where: { id: affiliateId },
      data: {
        tier,
        status,
        commission_rate_override: override !== undefined ? override : undefined,
      },
    });

    return serializeData(affiliate);
  }
}
