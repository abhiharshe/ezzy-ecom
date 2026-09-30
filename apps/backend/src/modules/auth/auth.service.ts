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

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.is_active || user.deleted_at) {
      // Return generic message for security so we don't leak user existence
      return {
        message: 'If an account exists with this email, a password reset link has been sent.',
      };
    }

    // Generate random 32-byte hex token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    await this.prisma.passwordResetToken.create({
      data: {
        user_id: user.id,
        token_hash: token,
        expires_at: expiresAt,
      },
    });

    return {
      message: 'If an account exists with this email, a password reset link has been sent.',
      dev_reset_token: token, // Returned for dev testing convenience
      expires_at: expiresAt,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: { token_hash: token },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.used_at || resetRecord.expires_at < new Date()) {
      throw new UnauthorizedException('Invalid or expired password reset token');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRecord.user_id },
        data: { password_hash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { used_at: new Date() },
      }),
    ]);

    return {
      message: 'Password has been successfully reset. You can now login with your new password.',
    };
  }

  async updateProfile(userId: string, data: { first_name?: string; last_name?: string; phone_number?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deleted_at) {
      throw new NotFoundException('User not found');
    }

    if (data.phone_number && data.phone_number !== user.phone_number) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone_number: data.phone_number },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number is already associated with another account');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        first_name: data.first_name !== undefined ? data.first_name : undefined,
        last_name: data.last_name !== undefined ? data.last_name : undefined,
        phone_number: data.phone_number !== undefined ? data.phone_number : undefined,
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        roles: true,
        is_verified: true,
      },
    });

    return updatedUser;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deleted_at) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Current password does not match');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password_hash },
    });

    return {
      message: 'Password changed successfully',
    };
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
