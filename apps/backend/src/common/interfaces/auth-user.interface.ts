import { UserRole } from '@ezzy-ecomm/database';

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: UserRole[];
  vendorId?: string;
  affiliateId?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  roles: UserRole[];
  vendorId?: string;
  affiliateId?: string;
}
