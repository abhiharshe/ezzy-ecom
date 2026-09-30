import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AffiliateTier,
  CommissionStatus,
  LedgerEntryType,
  AffiliateLedgerReferenceType,
} from '@ezzy-ecomm/database';
import { QueryCommissionsDto } from '../dto/query-commissions.dto';

function serializeData<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) =>
      typeof value === 'bigint' ? Number(value) : value
    )
  );
}

// Commission Rates Configuration
const TIER_RATES: Record<AffiliateTier, { directRate: number; uplineRate: number }> = {
  BRONZE: { directRate: 5.0, uplineRate: 1.0 },
  SILVER: { directRate: 7.0, uplineRate: 1.5 },
  GOLD: { directRate: 10.0, uplineRate: 2.0 },
  PLATINUM: { directRate: 12.0, uplineRate: 3.0 },
};

@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculates and creates multi-tier commission records for an order
   */
  async calculateAndCreateCommissions(
    orderId: string,
    affiliateCode: string,
    subtotalInPaise: bigint
  ) {
    const affiliate = await this.prisma.affiliateProfile.findUnique({
      where: { referral_code: affiliateCode },
      include: { upline: true },
    });

    if (!affiliate || affiliate.status !== 'ACTIVE' || affiliate.deleted_at) {
      this.logger.warn(`Invalid or inactive affiliate code: ${affiliateCode}`);
      return [];
    }

    const createdCommissions = [];

    // Tier 1 (Direct Affiliate)
    const directTierConfig = TIER_RATES[affiliate.tier] || TIER_RATES.BRONZE;
    const directRatePercent = affiliate.commission_rate_override
      ? Number(affiliate.commission_rate_override)
      : directTierConfig.directRate;

    const directCommissionPaise = BigInt(
      Math.round((Number(subtotalInPaise) * directRatePercent) / 100)
    );

    if (directCommissionPaise > BigInt(0)) {
      const tier1Comm = await this.prisma.affiliateCommission.create({
        data: {
          affiliate_id: affiliate.id,
          order_id: orderId,
          tier_level: 1,
          commission_in_paise: directCommissionPaise,
          status: CommissionStatus.PENDING,
        },
      });
      createdCommissions.push(tier1Comm);
    }

    // Tier 2 (Upline Affiliate)
    if (affiliate.upline && affiliate.upline.status === 'ACTIVE') {
      const uplineTierConfig = TIER_RATES[affiliate.upline.tier] || TIER_RATES.BRONZE;
      const uplineRatePercent = uplineTierConfig.uplineRate;
      const uplineCommissionPaise = BigInt(
        Math.round((Number(subtotalInPaise) * uplineRatePercent) / 100)
      );

      if (uplineCommissionPaise > BigInt(0)) {
        const tier2Comm = await this.prisma.affiliateCommission.create({
          data: {
            affiliate_id: affiliate.upline.id,
            order_id: orderId,
            tier_level: 2,
            commission_in_paise: uplineCommissionPaise,
            status: CommissionStatus.PENDING,
          },
        });
        createdCommissions.push(tier2Comm);
      }
    }

    this.logger.log(
      `Created ${createdCommissions.length} commission records for order ${orderId} via affiliate ${affiliateCode}`
    );
    return serializeData(createdCommissions);
  }

  /**
   * Approves pending commissions when order return escrow period completes and posts credits to CommissionLedger
   */
  async approveCommissionsForOrder(orderId: string) {
    const pendingCommissions = await this.prisma.affiliateCommission.findMany({
      where: { order_id: orderId, status: CommissionStatus.PENDING },
      include: {
        affiliate: {
          select: { id: true, referral_code: true },
        },
      },
    });

    if (pendingCommissions.length === 0) {
      return [];
    }

    const approved = await this.prisma.$transaction(async (tx) => {
      const results = [];

      for (const comm of pendingCommissions) {
        // 1. Update commission status
        const updatedComm = await tx.affiliateCommission.update({
          where: { id: comm.id },
          data: {
            status: CommissionStatus.APPROVED,
            approved_at: new Date(),
          },
        });

        // 2. Find latest ledger entry to compute running balance
        const latestEntry = await tx.commissionLedger.findFirst({
          where: { affiliate_id: comm.affiliate_id },
          orderBy: { created_at: 'desc' },
        });

        const prevBalance = latestEntry?.balance_after_in_paise ?? BigInt(0);
        const newBalance = prevBalance + comm.commission_in_paise;

        // 3. Insert dual-entry ledger record
        const ledgerEntry = await tx.commissionLedger.create({
          data: {
            affiliate_id: comm.affiliate_id,
            commission_id: comm.id,
            entry_type: LedgerEntryType.CREDIT,
            amount_in_paise: comm.commission_in_paise,
            balance_after_in_paise: newBalance,
            reference_type: AffiliateLedgerReferenceType.COMMISSION_EARNED,
            reference_id: comm.id,
            description: `Commission earned for Order #${orderId.slice(0, 8)} (Tier ${comm.tier_level})`,
          },
        });

        results.push({ commission: updatedComm, ledger: ledgerEntry });
      }

      return results;
    });

    this.logger.log(`Approved ${approved.length} commissions for order ${orderId}`);
    return serializeData(approved);
  }

  /**
   * Get affiliate commissions list
   */
  async getAffiliateCommissions(userId: string, query: QueryCommissionsDto) {
    const affiliate = await this.prisma.affiliateProfile.findUnique({
      where: { user_id: userId },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate profile not found');
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const whereCondition: Record<string, unknown> = {
      affiliate_id: affiliate.id,
    };
    if (query.status) {
      whereCondition.status = query.status;
    }

    const [total, commissions] = await Promise.all([
      this.prisma.affiliateCommission.count({ where: whereCondition }),
      this.prisma.affiliateCommission.findMany({
        where: whereCondition,
        include: {
          order: {
            select: {
              id: true,
              order_number: true,
              subtotal_in_paise: true,
              status: true,
              created_at: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return serializeData({
      items: commissions,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  }

  /**
   * Get affiliate financial statement ledger
   */
  async getAffiliateLedger(userId: string, page = 1, limit = 20) {
    const affiliate = await this.prisma.affiliateProfile.findUnique({
      where: { user_id: userId },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate profile not found');
    }

    const skip = (page - 1) * limit;
    const [total, entries] = await Promise.all([
      this.prisma.commissionLedger.count({
        where: { affiliate_id: affiliate.id },
      }),
      this.prisma.commissionLedger.findMany({
        where: { affiliate_id: affiliate.id },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return serializeData({
      items: entries,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  }
}
