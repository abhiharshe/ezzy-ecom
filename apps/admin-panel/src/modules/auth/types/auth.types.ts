export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string | null;
  roles: string[];
  is_verified?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
}
