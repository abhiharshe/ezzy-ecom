import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserRole, VendorStatus } from '@ezzy-ecomm/database';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VendorRegisterDto } from './dto/vendor-register.dto';
import { JwtPayload } from '../../common/interfaces/auth-user.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(dto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password_hash,
        first_name: dto.first_name,
        last_name: dto.last_name,
        phone_number: dto.phone_number,
        roles: [UserRole.CUSTOMER],
      },
    });

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        roles: user.roles,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        vendor_profile: true,
        affiliate_profile: true,
      },
    });

    if (!user || !user.is_active || user.deleted_at) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      roles: user.roles,
      vendorId: user.vendor_profile?.id,
      affiliateId: user.affiliate_profile?.id,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        roles: user.roles,
        vendor: user.vendor_profile
          ? {
              id: user.vendor_profile.id,
              business_name: user.vendor_profile.business_name,
              status: user.vendor_profile.status,
            }
          : null,
        affiliate: user.affiliate_profile
          ? {
              id: user.affiliate_profile.id,
              referral_code: user.affiliate_profile.referral_code,
              status: user.affiliate_profile.status,
            }
          : null,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: process.env.JWT_SECRET || 'fallback-secret-for-dev-only',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          vendor_profile: true,
          affiliate_profile: true,
        },
      });

      if (!user || !user.is_active || user.deleted_at) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens({
        sub: user.id,
        email: user.email,
        roles: user.roles,
        vendorId: user.vendor_profile?.id,
        affiliateId: user.affiliate_profile?.id,
      });

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async registerVendor(userId: string, dto: VendorRegisterDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { vendor_profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.vendor_profile) {
      throw new ConflictException('User already has an associated vendor profile');
    }

    const slug =
      dto.slug ||
      dto.business_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') +
        '-' +
        Math.floor(1000 + Math.random() * 9000);

    const updatedRoles = Array.from(
      new Set([...user.roles, UserRole.VENDOR])
    );

    const [vendor] = await this.prisma.$transaction([
      this.prisma.vendorProfile.create({
        data: {
          user_id: user.id,
          business_name: dto.business_name,
          slug,
          gstin: dto.gstin,
          pan_number: dto.pan_number,
          description: dto.description,
          support_email: dto.support_email || user.email,
          support_phone: dto.support_phone,
          status: VendorStatus.ACTIVE,
        },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { roles: updatedRoles },
      }),
    ]);

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      roles: updatedRoles,
      vendorId: vendor.id,
    });

    return {
      vendor,
      ...tokens,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        roles: true,
        is_verified: true,
        created_at: true,
        addresses: {
          where: { deleted_at: null },
        },
        vendor_profile: true,
        affiliate_profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async generateTokens(payload: JwtPayload) {
    const secret = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';
    const accessToken = this.jwtService.sign(payload, {
      secret,
      expiresIn: '7d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret,
      expiresIn: '30d',
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 604800, // 7 days in seconds
    };
  }
}
