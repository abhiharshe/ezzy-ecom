import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload, AuthenticatedUser } from '../../../common/interfaces/auth-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    const secret = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        vendor_profile: {
          select: { id: true, status: true },
        },
        affiliate_profile: {
          select: { id: true, status: true },
        },
      },
    });

    if (!user || !user.is_active || user.deleted_at) {
      throw new UnauthorizedException('User account is invalid or deactivated');
    }

    return {
      id: user.id,
      email: user.email,
      roles: user.roles,
      vendorId: user.vendor_profile?.id,
      affiliateId: user.affiliate_profile?.id,
    };
  }
}
