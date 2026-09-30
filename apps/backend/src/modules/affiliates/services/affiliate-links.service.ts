import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAffiliateLinkDto } from '../dto/create-affiliate-link.dto';

function serializeData<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) =>
      typeof value === 'bigint' ? Number(value) : value
    )
  );
}

@Injectable()
export class AffiliateLinksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new tracking link for an affiliate
   */
  async createLink(userId: string, dto: CreateAffiliateLinkDto) {
    const affiliate = await this.prisma.affiliateProfile.findUnique({
      where: { user_id: userId },
    });

    if (!affiliate || affiliate.deleted_at || affiliate.status !== 'ACTIVE') {
      throw new NotFoundException('Active affiliate profile not found');
    }

    let slug = dto.custom_slug;
    if (slug) {
      const existing = await this.prisma.affiliateLink.findUnique({
        where: { slug },
      });
      if (existing) {
        throw new ConflictException(`Link slug "${slug}" already exists`);
      }
    } else {
      const rand = Math.random().toString(36).substring(2, 8);
      slug = `aff-${affiliate.referral_code.toLowerCase()}-${rand}`;
    }

    const link = await this.prisma.affiliateLink.create({
      data: {
        affiliate_id: affiliate.id,
        product_id: dto.product_id || null,
        campaign: dto.campaign || null,
        slug,
        destination_url: dto.destination_url,
      },
      include: {
        product: { select: { id: true, name: true, slug: true } },
      },
    });

    return serializeData(link);
  }

  /**
   * Get all links for an affiliate
   */
  async getMyLinks(userId: string) {
    const affiliate = await this.prisma.affiliateProfile.findUnique({
      where: { user_id: userId },
    });

    if (!affiliate) {
      throw new NotFoundException('Affiliate profile not found');
    }

    const links = await this.prisma.affiliateLink.findMany({
      where: { affiliate_id: affiliate.id },
      include: {
        product: {
          select: { id: true, name: true, slug: true, base_price_in_paise: true },
        },
        _count: { select: { clicks: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return serializeData(links);
  }

  /**
   * Public click tracking endpoint
   * Increments click counter, logs click with 30-day session TTL, returns destination URL & referral code
   */
  async trackClick(
    slug: string,
    metadata: {
      sessionId: string;
      ipAddress?: string;
      userAgent?: string;
      referrerUrl?: string;
    }
  ) {
    const link = await this.prisma.affiliateLink.findUnique({
      where: { slug },
      include: {
        affiliate: { select: { id: true, referral_code: true, status: true } },
      },
    });

    if (!link || link.affiliate.status !== 'ACTIVE') {
      throw new NotFoundException('Affiliate link not found or inactive');
    }

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 Days Attribution TTL

    await this.prisma.$transaction([
      this.prisma.affiliateLink.update({
        where: { id: link.id },
        data: { click_count: { increment: 1 } },
      }),
      this.prisma.affiliateClick.create({
        data: {
          affiliate_link_id: link.id,
          session_id: metadata.sessionId,
          ip_address: metadata.ipAddress || null,
          user_agent: metadata.userAgent || null,
          referrer_url: metadata.referrerUrl || null,
          expires_at: expiresAt,
        },
      }),
    ]);

    return {
      destination_url: link.destination_url,
      affiliate_code: link.affiliate.referral_code,
      product_id: link.product_id,
      expires_at: expiresAt,
    };
  }
}
