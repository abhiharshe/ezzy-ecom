import {
  Controller,
  Get,
  Param,
  Req,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { AffiliateLinksService } from '../services/affiliate-links.service';
import { Public } from '../../../common/decorators/public.decorator';

@Controller('r')
export class AffiliateTrackingController {
  constructor(private readonly linksService: AffiliateLinksService) {}

  @Public()
  @Get(':slug')
  async trackAndRedirect(
    @Param('slug') slug: string,
    @Req() req: Request,
    @Query('session_id') querySessionId?: string
  ) {
    const sessionId =
      querySessionId ||
      (req.headers['x-session-id'] as string) ||
      `sess_${Math.random().toString(36).substring(2, 12)}`;

    const ipAddress =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const referrerUrl = req.headers['referer'];

    const result = await this.linksService.trackClick(slug, {
      sessionId,
      ipAddress,
      userAgent,
      referrerUrl,
    });

    return {
      success: true,
      redirect_to: result.destination_url,
      affiliate_code: result.affiliate_code,
      session_id: sessionId,
      expires_at: result.expires_at,
    };
  }
}
