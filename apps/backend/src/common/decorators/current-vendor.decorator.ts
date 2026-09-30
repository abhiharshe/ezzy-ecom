import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/auth-user.interface';

export const CurrentVendor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;

    if (!user || !user.vendorId) {
      throw new ForbiddenException(
        'Access denied: You must be associated with an active vendor profile.'
      );
    }

    return user.vendorId;
  }
);
