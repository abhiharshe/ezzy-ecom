import { httpClient } from '@/core/http/client';
import { API_ENDPOINTS } from '@/core/http/endpoints';
import type { AuthResponse, AuthTokens, AuthUser } from '../types/auth.types';

export const authApi = {
  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    return httpClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
  },

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    return httpClient.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken });
  },

  async getMe(): Promise<AuthUser> {
    return httpClient.get(API_ENDPOINTS.AUTH.ME);
  },

  async forgotPassword(email: string): Promise<{ message: string; dev_reset_token?: string; expires_at?: string }> {
    return httpClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  },

  async resetPassword(payload: { token: string; new_password: string }): Promise<{ message: string }> {
    return httpClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, payload);
  },

  async updateProfile(payload: { first_name?: string; last_name?: string; phone_number?: string }): Promise<AuthUser> {
    return httpClient.patch(API_ENDPOINTS.AUTH.UPDATE_PROFILE, payload);
  },

  async changePassword(payload: { current_password: string; new_password: string }): Promise<{ message: string }> {
    return httpClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, payload);
  },
};
