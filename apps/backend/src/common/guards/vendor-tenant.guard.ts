import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@ezzy-ecomm/database';
import { AuthenticatedUser } from '../interfaces/auth-user.interface';

@Injectable()
export class VendorTenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;

    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    // Admins and Super Admins can bypass vendor tenant scoping if needed for platform operations
    if (
      user.roles.includes(UserRole.SUPER_ADMIN) ||
      user.roles.includes(UserRole.ADMIN)
    ) {
      return true;
    }

    if (!user.roles.includes(UserRole.VENDOR) || !user.vendorId) {
      throw new ForbiddenException(
        'Access denied: You do not have an active vendor account'
      );
    }

    // If the route contains a vendorId parameter, ensure it matches the token's vendorId
    const paramVendorId =
      request.params?.vendorId || request.params?.vendor_id;
    if (paramVendorId && paramVendorId !== user.vendorId) {
      throw new ForbiddenException(
        'Cross-tenant violation: Cannot access or modify resources belonging to another vendor'
      );
    }

    return true;
  }
}
