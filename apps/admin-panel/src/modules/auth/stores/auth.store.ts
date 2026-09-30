import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '../api/auth.api';
import type { AuthUser } from '../types/auth.types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(
    localStorage.getItem('authUser')
      ? JSON.parse(localStorage.getItem('authUser')!)
      : null
  );
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'));
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'));
  const loading = ref(false);

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value);
  const isAdmin = computed(() =>
    user.value?.roles?.some((r) => r === 'ADMIN' || r === 'SUPER_ADMIN') ?? false
  );
  const isSuperAdmin = computed(() =>
    user.value?.roles?.includes('SUPER_ADMIN') ?? false
  );
  const fullName = computed(() => {
    if (!user.value) return 'Super Admin';
    return `${user.value.first_name} ${user.value.last_name}`.trim();
  });

  const setAuth = (authData: { user: AuthUser; accessToken: string; refreshToken: string }) => {
    user.value = authData.user;
    accessToken.value = authData.accessToken;
    refreshToken.value = authData.refreshToken;

    localStorage.setItem('authUser', JSON.stringify(authData.user));
    localStorage.setItem('accessToken', authData.accessToken);
    localStorage.setItem('refreshToken', authData.refreshToken);
  };

  const login = async (credentials: { email: string; password: string }) => {
    loading.value = true;
    try {
      const response = await authApi.login(credentials);
      // Validate that user has admin privileges
      const hasAdminRole = response.user.roles.some(
        (r) => r === 'ADMIN' || r === 'SUPER_ADMIN'
      );
      if (!hasAdminRole) {
        throw new Error('Access denied: You do not have Superadmin privileges.');
      }
      setAuth(response);
      return response;
    } finally {
      loading.value = false;
    }
  };

  const logout = () => {
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;

    localStorage.removeItem('authUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    window.location.href = '/login';
  };

  const fetchCurrentUser = async () => {
    if (!accessToken.value) return null;
    try {
      const freshUser = await authApi.getMe();
      user.value = freshUser;
      localStorage.setItem('authUser', JSON.stringify(freshUser));
      return freshUser;
    } catch {
      logout();
      return null;
    }
  };

  const updateProfile = async (payload: { first_name?: string; last_name?: string; phone_number?: string }) => {
    const updated = await authApi.updateProfile(payload);
    if (user.value) {
      user.value = { ...user.value, ...updated };
      localStorage.setItem('authUser', JSON.stringify(user.value));
    }
    return updated;
  };

  return {
    user,
    accessToken,
    refreshToken,
    loading,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    fullName,
    setAuth,
    login,
    logout,
    fetchCurrentUser,
    updateProfile,
  };
});
